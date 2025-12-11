import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    
    // Check permission to manage users or roles
    const canManage = await hasPermission("manage", "users");
    if (!canManage) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    try {
        const body = await req.json();
        const { roles } = body; // Array of role names

        if (!Array.isArray(roles)) {
            return new NextResponse("Invalid body", { status: 400 });
        }

        // Find role IDs for these names
        const dbRoles = await prisma.role.findMany({
            where: { name: { in: roles } },
            select: { id: true },
        });

        // Update user roles using 'set' to replace existing ones
        await prisma.user.update({
            where: { id },
            data: {
                roles: {
                    set: dbRoles.map((r) => ({ id: r.id })),
                },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to update user roles", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
