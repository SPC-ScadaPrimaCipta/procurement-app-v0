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

        // Check if org unit exists
        const existing = await prisma.org_unit.findUnique({
            where: { id },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Org unit not found" },
                { status: 404 }
            );
        }

        // Check if parent_unit_id exists if provided
        if (body.parent_unit_id && body.parent_unit_id !== id) {
            const parentExists = await prisma.org_unit.findUnique({
                where: { id: body.parent_unit_id },
            });

            if (!parentExists) {
                return NextResponse.json(
                    { error: "Parent unit not found" },
                    { status: 404 }
                );
            }

            // Prevent circular reference - check if parent_unit_id is not a descendant
            const checkCircular = async (parentId: string, originalId: string): Promise<boolean> => {
                if (parentId === originalId) return true;
                
                const parent = await prisma.org_unit.findUnique({
                    where: { id: parentId },
                    select: { parent_unit_id: true },
                });

                if (parent?.parent_unit_id) {
                    return await checkCircular(parent.parent_unit_id, originalId);
                }

                return false;
            };

            const isCircular = await checkCircular(body.parent_unit_id, id);
            if (isCircular) {
                return NextResponse.json(
                    { error: "Cannot set parent unit: circular reference detected" },
                    { status: 400 }
                );
            }
        }

        const updated = await prisma.org_unit.update({
            where: { id },
            data: {
                unit_type: body.unit_type,
                unit_code: body.unit_code || null,
                unit_name: body.unit_name,
                parent_unit_id: body.parent_unit_id || null,
                is_active: body.is_active,
            },
            select: {
                id: true,
                unit_type: true,
                unit_code: true,
                unit_name: true,
                parent_unit_id: true,
                is_active: true,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error("Error updating org unit:", error);

        return NextResponse.json(
            { error: "Failed to update org unit" },
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

        // Check if org unit exists
        const existing = await prisma.org_unit.findUnique({
            where: { id },
            include: {
                children: true,
            },
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Org unit not found" },
                { status: 404 }
            );
        }

        // Check if has children
        if (existing.children && existing.children.length > 0) {
            return NextResponse.json(
                { error: "Cannot delete org unit because it has child units" },
                { status: 409 }
            );
        }

        await prisma.org_unit.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Org unit deleted successfully" });
    } catch (error: any) {
        console.error("Error deleting org unit:", error);

        if (error.code === "P2003") {
            return NextResponse.json(
                { error: "Cannot delete org unit because it is being used" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to delete org unit" },
            { status: 500 }
        );
    }
}
