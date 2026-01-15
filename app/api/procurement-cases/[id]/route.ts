import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getWorkflowData } from "@/lib/workflow/get-workflow-data";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canRead = await hasPermission("read", "pengadaan");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		const data = await prisma.procurement_case.findUnique({
			where: { id },
			include: {
				status: true,
				unit: true,
				correspondence_in: true,
				correspondence_out: true,
				contract: {
					include: {
						vendor: true,
						contract_status: true,
						procurement_method: true,
					},
				},
				case_disposition_summary: {
					include: {
						forward_to: {
							include: {
								recipient: true,
							},
						},
					},
				},
			},
		});

		if (!data) {
			return new NextResponse("Not Found", { status: 404 });
		}

		// Resolve creator names
		const createdByName = await resolveUserName(data.created_by);
		const correspondenceInCreator = data.correspondence_in
			? await resolveUserName(data.correspondence_in.created_by)
			: null;

		// Map correspondence_out creators
		const correspondenceOutWithNames = await Promise.all(
			data.correspondence_out.map(async (item) => ({
				...item,
				created_by_name: await resolveUserName(item.created_by),
			}))
		);

		const { currentStepInstanceId, workflowTrack } = await getWorkflowData(
			"PROCUREMENT_CASE",
			id,
			session?.user?.id
		);

		// Parse disposition actions to ensure array
		let parsedDispositionActions: string[] = [];
		if (data.case_disposition_summary?.disposition_actions) {
			try {
				const raw = data.case_disposition_summary.disposition_actions;
				if (raw.trim().startsWith("[")) {
					parsedDispositionActions = JSON.parse(raw);
				} else {
					parsedDispositionActions = [raw];
				}
			} catch (e) {
				parsedDispositionActions = [
					data.case_disposition_summary.disposition_actions,
				];
			}
		}

		// Fetch relevant documents
		let documents: any[] = [];
		const rawDocs = await prisma.document.findMany({
			where: {
				ref_type: "PROCUREMENT_CASE",
				ref_id: id,
				master_doc_type: {
					name: {
						in: ["SCAN SURAT MASUK", "RAB", "TOR"],
					},
				},
			},
			include: {
				master_doc_type: true,
			},
		});

		// Handle BigInt serialization
		documents = rawDocs.map((doc) => ({
			...doc,
			file_size: doc.file_size ? doc.file_size.toString() : null,
		}));

		return NextResponse.json({
			...data,
			created_by_name: createdByName,
			correspondence_in: data.correspondence_in
				? {
						...data.correspondence_in,
						created_by_name: correspondenceInCreator,
				  }
				: null,
			correspondence_out: correspondenceOutWithNames,
			currentStepInstanceId,
			workflow_track: workflowTrack,
			case_disposition_summary: data.case_disposition_summary
				? {
						...data.case_disposition_summary,
						disposition_actions: parsedDispositionActions, // Override with parsed array
				  }
				: null,
			documents,
		});
	} catch (error) {
		console.error("Error fetching procurement case details:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	// 1. Auth check
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	try {
		// 2. Perform deletion in transaction
		await prisma.$transaction(async (tx) => {
			// A. Cleanup Workflow (if exists)
			const wfInstance = await tx.workflow_instance.findUnique({
				where: {
					ref_type_ref_id: {
						ref_type: "PROCUREMENT_CASE",
						ref_id: id,
					},
				},
			});

			if (wfInstance) {
				// Delete logs first (foreign key constraint)
				await tx.workflow_action_log.deleteMany({
					where: { workflow_instance_id: wfInstance.id },
				});
				// Delete step instances
				await tx.workflow_step_instance.deleteMany({
					where: { workflow_instance_id: wfInstance.id },
				});
				// Delete the instance itself
				await tx.workflow_instance.delete({
					where: { id: wfInstance.id },
				});
			}

			// B. Cleanup Documents
			await tx.document.deleteMany({
				where: {
					ref_type: "PROCUREMENT_CASE",
					ref_id: id,
				},
			});

			// C. Cleanup Case (cascades to correspondence, etc.)
			await tx.procurement_case.delete({
				where: { id },
			});
		});

		return new NextResponse("Deleted successfully", { status: 200 });
	} catch (error) {
		console.error("Error deleting procurement case:", error);
		// Return friendly error
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
