import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const docs = await prisma.document.findMany({
            where: { is_active: false },
            orderBy: { title: "asc" },
            select: {
                id: true,
                title: true,
                doc_date: true,
                file_name: true,
                ref_type: true,
                uploaded_by: true,
                master_doc_type: {
                    select: { name: true },
                },
            },
        });

        const formatted = await Promise.all(
            docs.map(async (d) => {
                let uploaderName: string | null = null;
                try {
                    if (d.uploaded_by) {
                        const user = await prisma.user.findUnique({
                            where: { id: d.uploaded_by },
                            select: { name: true },
                        });
                        uploaderName = user?.name ?? null;
                    }
                } catch (e) {
                }

                return {
                    id: d.id,
                    doc_name: d.master_doc_type?.name || null,
                    title: d.title,
                    doc_date: d.doc_date,
                    file_name: d.file_name,
                    ref_type: d.ref_type,
                    uploaded_by: d.uploaded_by,
                    uploaded_by_name: uploaderName,
                };
            })
        );

        return NextResponse.json({ data: formatted });
    } catch (error) {
            console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Failed to fetch documents" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { ids } = await request.json();

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "ids must be a non-empty array" },
                { status: 400 }
            );
        }

        await prisma.document.deleteMany({
            where: {
                id: {
                    in: ids,
                },
            },
        });

        return NextResponse.json({
            success: true,
            deletedCount: ids.length,
            message: "Documents permanently deleted",
        });
    } catch (error) {
        console.error("Bulk Delete API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
