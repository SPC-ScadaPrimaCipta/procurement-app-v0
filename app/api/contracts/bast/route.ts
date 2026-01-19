import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await req.json();
		const {
			contractId,
			paymentPlanId,
			bastNumber,
			bastDate,
			progress,
			notes,
			attachment, // This will be the document ID from the upload
		} = body;

		// Validation
		if (!contractId || !bastNumber || !bastDate || progress === undefined) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 }
			);
		}

		// Create BAST record
		const bast = await prisma.bast.create({
			data: {
				contract_id: contractId,
				payment_plan_id: paymentPlanId, // Make sure this relation exists in schema
				bast_number: bastNumber,
				bast_date: new Date(bastDate),
				progress_percent: parseFloat(progress),
				notes: notes,
				bast_type: "BAST", // Default or determine based on progress
				created_by: session.user.id,
			},
		});

		// Link document if provided (assuming document structure)
		// Usually we might link `document` to `bast` or just store file ref.
		// For now simple creation.

		return NextResponse.json({ data: bast }, { status: 201 });
	} catch (error: any) {
		console.error("Error creating BAST:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to create BAST" },
			{ status: 500 }
		);
	}
}
