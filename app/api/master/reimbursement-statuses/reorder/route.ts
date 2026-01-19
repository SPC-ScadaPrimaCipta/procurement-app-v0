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
        const { statuses } = body;

        if (!Array.isArray(statuses)) {
            return NextResponse.json(
                { error: "Invalid data format" },
                { status: 400 }
            );
        }

        await prisma.$transaction(
            statuses.map((status: { id: string; sort_order: number }) =>
                prisma.reimbursement_status.update({
                    where: { id: status.id },
                    data: { sort_order: status.sort_order },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering reimbursement status:", error);
        return NextResponse.json(
            { error: "Failed to update reimbursement status order" },
            { status: 500 }
        );
    }
}
