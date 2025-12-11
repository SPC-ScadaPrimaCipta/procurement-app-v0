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
		const { action, resource, description } = body;

		const updated = await prisma.permission.update({
			where: { id },
			data: { action, resource, description },
		});

		return NextResponse.json(updated);
	} catch (error) {
		return new NextResponse("Failed to update permission", { status: 500 });
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
		await prisma.permission.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (error) {
		return new NextResponse("Failed to delete permission", { status: 500 });
	}
}
