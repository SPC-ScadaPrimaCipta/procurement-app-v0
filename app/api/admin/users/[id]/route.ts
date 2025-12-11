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

		// Handle Role Update
		if (body.roles && Array.isArray(body.roles)) {
			const dbRoles = await prisma.role.findMany({
				where: { name: { in: body.roles } },
				select: { id: true },
			});

			await prisma.user.update({
				where: { id },
				data: {
					roles: {
						set: dbRoles.map((r) => ({ id: r.id })),
					},
				},
			});
			return NextResponse.json({ success: true });
		}

		// Handle Details Update (Name, etc.)
		if (body.name) {
			const updated = await prisma.user.update({
				where: { id },
				data: { name: body.name },
			});
			return NextResponse.json(updated);
		}

		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Failed to update user", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canManage = await hasPermission("manage", "users");
	if (!canManage) return new NextResponse("Forbidden", { status: 403 });

	try {
		await prisma.user.delete({
			where: { id },
		});
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Delete user error", error);
		return new NextResponse("Failed to delete user", { status: 500 });
	}
}
