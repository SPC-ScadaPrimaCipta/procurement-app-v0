import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get all active vendors for dropdown
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const vendors = await prisma.vendor.findMany({
			where: {
				is_active: true,
			},
			select: {
				id: true,
				vendor_name: true,
			},
			orderBy: {
				vendor_name: "asc",
			},
		});

		return NextResponse.json(vendors);
	} catch (error) {
		console.error("Error fetching vendors:", error);
		return NextResponse.json(
			{ error: "Failed to fetch vendors" },
			{ status: 500 }
		);
	}
}
