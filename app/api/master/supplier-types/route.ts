import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
