import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: documentId } = await context.params;

    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        if (!documentId) {
            return NextResponse.json(
                { error: "documentId is required in URL" },
                { status: 400 }
            );
        }

        const existing = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        const restored = await prisma.document.update({
            where: { id: documentId },
            data: {
                is_active: true,
                deleted_at: null,
                deleted_by: null,
            },
        });

        return NextResponse.json({
            success: true,
            documentId,
            message: "Document restored",
        });
    } catch (error) {
        console.error("Restore API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
