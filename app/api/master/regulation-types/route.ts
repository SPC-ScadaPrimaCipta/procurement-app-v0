import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// GET: Fetch all active regulation types
export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const regulationTypes = await prisma.regulation_type.findMany({
			orderBy: {
				sort_order: "asc",
			},
			select: {
				id: true,
				name: true,
				is_active: true,
				sort_order: true,
				created_at: true,
			},
		});

		return NextResponse.json(regulationTypes);
	} catch (error) {
		console.error("Error fetching regulation types:", error);
		return NextResponse.json(
			{ error: "Failed to fetch regulation types" },
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

		// Get next sort_order
		const maxOrderRecord = await prisma.regulation_type.findFirst({
			orderBy: { sort_order: "desc" },
			select: { sort_order: true },
		});
		const nextOrder = (maxOrderRecord?.sort_order ?? 0) + 1;

		const data: any = {
			...body,
			sort_order: nextOrder,
			created_by: session.user.id,
		};

		if (data.is_active === undefined) data.is_active = true;

		const existing = await prisma.regulation_type.findUnique({
			where: { name: data.name },
		});

		if (existing) {
			return NextResponse.json(
				{ error: `Regulation type '${data.name}' already exists.` },
				{ status: 409 },
			);
		}

		const newValue = await prisma.regulation_type.create({
			data,
			select: {
				id: true,
				name: true,
				is_active: true,
				sort_order: true,
			},
		});

		return NextResponse.json(newValue, { status: 201 });

	} catch (error: any) {
		console.error("Error creating regulation type:", error);

		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: `Regulation type already exists (duplicate '${error.meta?.target}')` },
				{ status: 409 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to create regulation type" },
			{ status: 500 },
		);
	}
}
