import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export const dynamic = "force-dynamic";

// GET: Get all reimbursement statuses
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const statuses = await prisma.reimbursement_status.findMany({
			select: {
				id: true,
				name: true,
				sort_order: true,
				is_active: true,
				created_at: true,
			},
			orderBy: {
				sort_order: "asc",
			},
		});

		return NextResponse.json(statuses);
	} catch (error) {
		console.error("Error fetching reimbursement statuses:", error);
		return NextResponse.json(
			{ error: "Failed to fetch reimbursement statuses" },
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
		const maxOrderRecord = await prisma.reimbursement_status.findFirst({
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

		const existing = await prisma.reimbursement_status.findUnique({
			where: { name: data.name },
		});

		if (existing) {
			return NextResponse.json(
				{ error: `Status '${data.name}' sudah ada` },
				{ status: 409 }
			);
		}

		const newValue = await prisma.reimbursement_status.create({
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
		console.error("Error creating reimbursement status:", error);

		if (error.code === "P2002") {
			return NextResponse.json(
				{ error: `Status sudah ada` },
				{ status: 409 }
			);
		}

		return NextResponse.json(
			{ error: "Failed to create reimbursement status" },
			{ status: 500 }
		);
	}
}
