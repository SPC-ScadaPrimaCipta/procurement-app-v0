import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function PUT(request: Request) {
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
        const { methods } = body;

        if (!Array.isArray(methods)) {
            return NextResponse.json(
                { error: "Invalid data format" },
                { status: 400 }
            );
        }

        await prisma.$transaction(
            methods.map((method: { id: string; sort_order: number }) =>
                prisma.master_procurement_method.update({
                    where: { id: method.id },
                    data: { sort_order: method.sort_order },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering procurement method:", error);
        return NextResponse.json(
            { error: "Failed to update procurement method order" },
            { status: 500 }
        );
    }
}
