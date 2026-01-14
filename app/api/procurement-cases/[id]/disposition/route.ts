import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// Basic permission check - assume if they can read/edit case they can update disposition
		const canRead = await hasPermission("read", "pengadaan");
		if (!canRead) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const body = await request.json();
		const {
			agenda_scope,
			agenda_number,
			disposition_date,
			disposition_actions, // Array of strings or IDs? Assuming JSON or comma-separated string based on request.
			disposition_note,
			forward_to_ids, // Array of recipient IDs
		} = body;

		// Validation?

		const dispositionDate = disposition_date
			? new Date(disposition_date)
			: new Date();

		// Handle relations
		// We use upsert on case_disposition_summary

		const actionsString = Array.isArray(disposition_actions)
			? JSON.stringify(disposition_actions)
			: disposition_actions;

		// Start transaction to handle join table updates
		const result = await prisma.$transaction(async (tx) => {
			// Upsert Summary
			const summary = await tx.case_disposition_summary.upsert({
				where: { case_id: id },
				create: {
					case_id: id,
					agenda_scope,
					agenda_number,
					disposition_date: dispositionDate,
					disposition_actions: actionsString,
					disposition_note,
					updated_by: session.user.id,
					updated_at: new Date(),
				},
				update: {
					agenda_scope,
					agenda_number,
					disposition_date: dispositionDate,
					disposition_actions: actionsString,
					disposition_note,
					updated_by: session.user.id,
					updated_at: new Date(),
				},
			});

			// Update Forward To
			// Delete existing for this summary
			await tx.case_disposition_forward_to.deleteMany({
				where: { case_disposition_summary_id: summary.id },
			});

			// Insert new
			if (Array.isArray(forward_to_ids) && forward_to_ids.length > 0) {
				await tx.case_disposition_forward_to.createMany({
					data: forward_to_ids.map((recipientId: string) => ({
						case_disposition_summary_id: summary.id,
						recipient_id: recipientId,
					})),
				});
			}

			return summary;
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error saving disposition:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
