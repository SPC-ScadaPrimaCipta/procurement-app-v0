import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// GET: Fetch all org units
export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const orgUnits = await prisma.org_unit.findMany({
			orderBy: {
				unit_name: "asc",
			},
			select: {
				id: true,
				unit_type: true,
				unit_code: true,
				unit_name: true,
				parent_unit_id: true,
				is_active: true,
				parent: {
					select: {
						id: true,
						unit_name: true,
					},
				},
			},
		});

		return NextResponse.json(orgUnits);
	} catch (error) {
		console.error("Error fetching org units:", error);
		return NextResponse.json(
			{ error: "Failed to fetch org units" },
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
			unit_type: body.unit_type,
			unit_code: body.unit_code || null,
			unit_name: body.unit_name,
			parent_unit_id: body.parent_unit_id || null,
			is_active: body.is_active !== undefined ? body.is_active : true,
		};

		// Check if parent_unit_id exists if provided
		if (data.parent_unit_id) {
			const parentExists = await prisma.org_unit.findUnique({
				where: { id: data.parent_unit_id },
			});

			if (!parentExists) {
				return NextResponse.json(
					{ error: "Parent unit not found" },
					{ status: 404 }
				);
			}
		}

		const newValue = await prisma.org_unit.create({
			data,
			select: {
				id: true,
				unit_type: true,
				unit_code: true,
				unit_name: true,
				parent_unit_id: true,
				is_active: true,
			},
		});

		return NextResponse.json(newValue, { status: 201 });

	} catch (error: any) {
		console.error("Error creating org unit:", error);

		return NextResponse.json(
			{ error: "Failed to create org unit" },
			{ status: 500 },
		);
	}
}
