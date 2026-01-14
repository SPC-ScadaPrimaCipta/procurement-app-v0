import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get all active reimbursement statuses for dropdown
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const statuses = await prisma.reimbursement_status.findMany({
			where: {
				is_active: true,
			},
			select: {
				id: true,
				name: true,
				sort_order: true,
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
