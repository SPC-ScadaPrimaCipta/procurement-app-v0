import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
	const canReadVal = await hasPermission("read", "roles");
	if (!canReadVal) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const permissions = await prisma.permission.findMany({
		orderBy: {
			resource: "asc",
		},
	});

	return NextResponse.json(permissions);
}

export async function POST(req: Request) {
	const canManage = await hasPermission("manage", "roles"); // Using 'manage:roles' as proxy for managing system perms
	if (!canManage) return new NextResponse("Forbidden", { status: 403 });

	try {
		const body = await req.json();
		const { action, resource, description } = body;

		if (!action || !resource) {
			return new NextResponse("Action and Resource required", {
				status: 400,
			});
		}

		const permission = await prisma.permission.create({
			data: {
				action,
				resource,
				description,
			},
		});

		return NextResponse.json(permission);
	} catch (error) {
		return new NextResponse("Failed to create permission (Duplicate?)", {
			status: 500,
		});
	}
}
