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
