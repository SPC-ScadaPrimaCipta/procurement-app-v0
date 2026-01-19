import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const { id: documentId } = params;
    
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

        const existingDoc = await prisma.document.findUnique({
            where: { id: documentId },
        });

        if (!existingDoc) {
            return NextResponse.json(
                { error: "Document not found" },
                { status: 404 }
            );
        }

        await prisma.document.delete({
            where: { id: documentId },
        });

        return NextResponse.json({
            success: true,
            documentId,
            message: "Document permanently deleted",
        });
    } catch (error) {
        console.error("Delete API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
