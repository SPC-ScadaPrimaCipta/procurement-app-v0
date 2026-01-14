import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;
        const body = await request.json();

        // Check if regulation type exists
        const existing = await prisma.regulation_type.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Regulation type not found" },
                { status: 404 }
            );
        }

        // Check for duplicate name (excluding current record)
        if (body.name && body.name !== existing.name) {
            const duplicate = await prisma.regulation_type.findUnique({
                where: { name: body.name },
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: `Regulation type '${body.name}' already exists` },
                    { status: 409 }
                );
            }
        }

        const updated = await prisma.regulation_type.update({
            where: { id },
            data: {
                name: body.name,
                is_active: body.is_active,
                sort_order: body.sort_order,
            },
            select: {
                id: true,
                name: true,
                is_active: true,
                sort_order: true,
                created_at: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating regulation type:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: "Regulation type with this name already exists" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to update regulation type" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
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

        const { id } = await params;

        // Check if regulation type exists
        const existing = await prisma.regulation_type.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Regulation type not found" },
                { status: 404 }
            );
        }

        await prisma.regulation_type.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Regulation type deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting regulation type:", error);

        if (error.code === "P2003") {
            return NextResponse.json(
                { error: "Cannot delete regulation type because it is being used" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to delete regulation type" },
            { status: 500 }
        );
    }
}
