import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateCaseCode } from "@/lib/procurement";
import { startWorkflow } from "@/lib/workflow/start-workflow";

export async function POST(req: Request) {
	const canCreate = await hasPermission("create", "NotaDinas");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const body = await req.json();
	const { from_name, letter_date, letter_number, subject, cc } = body;

	// Validation
	if (!from_name || !letter_date || !letter_number || !subject) {
		return new NextResponse("Missing required fields", { status: 400 });
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			// 1. Get Status 'WAITING KPA'
			let status = await tx.case_status.findUnique({
				where: { name: "WAITING KPA" },
			});

			if (!status) {
				// Create if absolutely missing
				status = await tx.case_status.create({
					data: {
						name: "WAITING KPA",
						is_active: true,
						sort_order: 2,
						created_by: "system",
					},
				});
			}

			// 2. Generate Case Code
			const case_code = await generateCaseCode(tx);

			// 3. Create Procurement Case
			const procurementCase = await tx.procurement_case.create({
				data: {
					case_code,
					title: subject,
					status_id: status.id,
					created_by: session.user.id,
				},
			});

			// 4. Create Correspondence In
			await tx.correspondence_in.create({
				data: {
					case_id: procurementCase.id,
					from_name,
					letter_date: new Date(letter_date),
					letter_number,
					subject,
					cc,
					received_date: new Date(),
					created_by: session.user.id,
				},
			});

			return procurementCase;
		});

		// 5. Handle Disposition if present
		if (body.disposition) {
			const {
				agenda_scope,
				agenda_number,
				disposition_date,
				disposition_actions,
				disposition_note,
				forward_to_ids,
			} = body.disposition;

			if (agenda_number) {
				const dispositionDate = disposition_date
					? new Date(disposition_date)
					: new Date();

				const actionsString = Array.isArray(disposition_actions)
					? JSON.stringify(disposition_actions)
					: disposition_actions;

				await prisma.$transaction(async (tx) => {
					// Upsert Summary
					const summary = await tx.case_disposition_summary.upsert({
						where: { case_id: result.id },
						create: {
							case_id: result.id,
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
					await tx.case_disposition_forward_to.deleteMany({
						where: { case_disposition_summary_id: summary.id },
					});

					if (
						Array.isArray(forward_to_ids) &&
						forward_to_ids.length > 0
					) {
						await tx.case_disposition_forward_to.createMany({
							data: forward_to_ids.map((recipientId: string) => ({
								case_disposition_summary_id: summary.id,
								recipient_id: recipientId,
							})),
						});
					}
				});
			}
		}

		try {
			await startWorkflow({
				workflowCode: "PROCUREMENT",
				refType: "PROCUREMENT_CASE",
				refId: result.id,
				userId: session.user.id,
			});
		} catch (wfError) {
			console.error(
				"Failed to start workflow for case " + result.id,
				wfError
			);
		}

		return NextResponse.json({
			case_id: result.id,
			case_code: result.case_code,
			message: "Submitted successfully",
		});
	} catch (error) {
		console.error("Error submitting nota dinas:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
