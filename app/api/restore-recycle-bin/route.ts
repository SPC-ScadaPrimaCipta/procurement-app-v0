import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let body;
        try {
            body = await request.json();
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { ids } = body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json(
                { error: "An array of document IDs is required" },
                { status: 400 }
            );
        }

        const updateResult = await prisma.document.updateMany({
            where: {
                id: { in: ids },
            },
            data: {
                is_active: true,
                deleted_at: null,
                deleted_by: null,
            },
        });

        return NextResponse.json({
            success: true,
            count: updateResult.count,
            message: "Documents restored and metadata cleared",
        });

    } catch (error) {
        console.error("Bulk Restore API Error:", error);
            return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}