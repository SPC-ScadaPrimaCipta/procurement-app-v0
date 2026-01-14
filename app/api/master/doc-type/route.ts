import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const docType = await prisma.master_doc_type.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
                is_active: true,
                created_at: true,
            },
        });

        return NextResponse.json(docType);
    } catch (error) {
        console.error("Error fetching document type:", error);
        return NextResponse.json(
            { error: "Failed to fetch document type" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const canManage = await hasPermission("manage", "masterData");
        if (!canManage) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const data: any = {
            ...body,
            created_by: session.user.id,
        };

        if (data.is_active === undefined) data.is_active = true;

        const existing = await prisma.master_doc_type.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Document type '${data.name}' already exists.` },
                { status: 409 }, // Conflict
            );
        }

        const newValue = await prisma.master_doc_type.create({
            data,
            select: {
                id: true,
                name: true,
                is_active: true,
            },
        });

        return NextResponse.json(newValue, { status: 201 });

    } catch (error: any) {
        console.error("Error creating document type:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: `Document type already exists (duplicate '${error.meta?.target}')` },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: "Failed to create document type" },
            { status: 500 },
        );
    }
}
