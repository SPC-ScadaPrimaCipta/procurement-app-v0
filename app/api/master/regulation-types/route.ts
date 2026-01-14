import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
			where: {
				is_active: true,
			},
			orderBy: {
				sort_order: "asc",
			},
			select: {
				id: true,
				name: true,
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
