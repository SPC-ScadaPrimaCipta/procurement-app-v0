import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveUserName } from "@/lib/user-utils";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canRead = await hasPermission("read", "notadinas");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		const result = await prisma.correspondence_in.findUnique({
			where: { id },
			include: {
				procurement_case: {
					include: {
						status: true,
						unit: true,
					},
				},
			},
		});

		if (!result) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const createdByName = await resolveUserName(result.created_by);

		let currentStepInstanceId = null;

		if (session?.user?.id && result.case_id) {
			const workflowInstance = await prisma.workflow_instance.findUnique({
				where: {
					ref_type_ref_id: {
						ref_type: "PROCUREMENT_CASE",
						ref_id: result.case_id,
					},
				},
			});

			if (workflowInstance) {
				const stepInstances =
					await prisma.workflow_step_instance.findMany({
						where: {
							workflow_instance_id: workflowInstance.id,
							status: "PENDING",
						},
					});

				const assignment = stepInstances.find((step) => {
					const assigned = step.assigned_to as string[];
					return (
						Array.isArray(assigned) &&
						assigned.includes(session.user.id)
					);
				});

				if (assignment) {
					currentStepInstanceId = assignment.id;
				}
			}
		}

		// Fetch relevant documents
		let documents: any[] = [];
		if (result.case_id) {
			const rawDocs = await prisma.document.findMany({
				where: {
					ref_type: "PROCUREMENT_CASE",
					ref_id: result.case_id,
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
		}

		return NextResponse.json({
			...result,
			created_by: createdByName,
			currentStepInstanceId,
			documents,
		});
	} catch (error) {
		console.error("Error fetching nota dinas detail:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
