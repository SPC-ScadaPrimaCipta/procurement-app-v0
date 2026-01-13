import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

// GET all supplier types
export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const supplierTypes = await prisma.master_supplier_type.findMany({
			where: {
				is_active: true,
			},
			orderBy: {
				name: "asc",
			},
			select: {
				id: true,
				name: true,
			},
		});

		return NextResponse.json(supplierTypes);
	} catch (error) {
		console.error("Error fetching supplier types:", error);
		return NextResponse.json(
			{ error: "Failed to fetch supplier types" },
			{ status: 500 }
		);
	}
}

export async function POST(request: Request) {
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

		const data: any = {
			...body,
			created_by: session.user.id,
		};

		if (data.is_active === undefined) data.is_active = true;
		if (data.sort_order === undefined) data.sort_order = 0;

		const existing = await prisma.master_supplier_type.findUnique({
			where: { name: data.name },
		});

		if (existing) {
			return NextResponse.json(
				{ error: `Supplier type '${data.name}' already exists.` },
				{ status: 409 }, // Conflict
			);
		}

		const newValue = await prisma.master_supplier_type.create({
			data,
			select: {
				id: true,
				name: true,
				is_active: true
			},
		});

		return NextResponse.json(newValue, { status: 201 });

	} catch (error: any) {
		console.error("Error creating supplier type:", error);

		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: `Supplier type already exists (duplicate '${error.meta?.target}')` },
				{ status: 409 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to create supplier type" },
			{ status: 500 },
		);
	}
}

