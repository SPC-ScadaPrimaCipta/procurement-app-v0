import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
	const canReadVal = await hasPermission("read", "roles");
	if (!canReadVal) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const roles = await prisma.role.findMany({
		include: {
			_count: {
				select: { users: true, permissions: true },
			},
			permissions: true, // Include permissions for editing
		},
	});

	return NextResponse.json(roles);
}

export async function POST(req: Request) {
	const canManage = await hasPermission("manage", "roles");
	if (!canManage) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const body = await req.json();
		const { name, description, permissionIds } = body;

		if (!name) return new NextResponse("Name required", { status: 400 });

		const role = await prisma.role.create({
			data: {
				name,
				description,
				permissions: {
					connect: permissionIds?.map((id: string) => ({ id })) || [],
				},
			},
		});

		return NextResponse.json(role);
	} catch (error) {
		// e.g. Unique constraint on name
		return new NextResponse("Failed to create role", { status: 500 });
	}
}
