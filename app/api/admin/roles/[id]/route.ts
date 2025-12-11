import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canManage = await hasPermission("manage", "roles");
	if (!canManage) return new NextResponse("Forbidden", { status: 403 });

	try {
		const body = await req.json();
		const { name, description, permissionIds } = body;

		// Disconnect all existing permissions first, then connect new ones (simplest approach)
		// Or better: set the relation
		const updatedRole = await prisma.role.update({
			where: { id },
			data: {
				name,
				description,
				permissions: {
					set: [], // Clear all
					connect:
						permissionIds?.map((pid: string) => ({ id: pid })) ||
						[],
				},
			},
		});

		return NextResponse.json(updatedRole);
	} catch (error) {
		console.error("Update role error", error);
		return new NextResponse("Failed to update role", { status: 500 });
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canManage = await hasPermission("manage", "roles");
	if (!canManage) return new NextResponse("Forbidden", { status: 403 });

	try {
		// Optional: Prevent deleting superadmin
		const role = await prisma.role.findUnique({ where: { id } });
		if (role?.name === "superadmin") {
			return new NextResponse("Cannot delete Superadmin", {
				status: 400,
			});
		}

		await prisma.role.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		return new NextResponse("Failed to delete role", { status: 500 });
	}
}
