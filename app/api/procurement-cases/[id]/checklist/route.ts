import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id: caseId } = await params;

	// 1. Auth check
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const user = session.user;
	const url = new URL(request.url);
	const workflowStepInstanceId = url.searchParams.get(
		"workflowStepInstanceId"
	);
	const workflowStepId = url.searchParams.get("workflowStepId");
	const includeDocs = url.searchParams.get("includeDocs") === "true";

	try {
		// 2. Validate case exists + authorization
		const procurementCase = await prisma.procurement_case.findUnique({
			where: { id: caseId },
		});

		if (!procurementCase) {
			return new NextResponse("Case not found", { status: 404 });
		}

		// Permission check
		// Allow if has role KPA/PPK/Admin/Superadmin or is created_by
		const userRoles = (user as any).roles || [];
		const hasElevatedRole = userRoles.some((r: string) =>
			["admin", "superadmin", "kpa", "ppk"].includes(r.toLowerCase())
		);
		const isCreator = procurementCase.created_by === user.id;

		if (!hasElevatedRole && !isCreator) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		// 3. Resolve current case_step
		let caseStep = null;
		let workflowStep = null;

		if (workflowStepInstanceId) {
			const stepInstance = await prisma.workflow_step_instance.findUnique(
				{
					where: { id: workflowStepInstanceId },
					include: {
						workflow_instance: true,
						step: true, // This is the workflow_step
					},
				}
			);

			if (!stepInstance) {
				return new NextResponse("Invalid workflowStepInstanceId", {
					status: 400,
				});
			}

			// Ensure stepInstance belongs to same case
			if (
				stepInstance.workflow_instance.ref_type !==
					"PROCUREMENT_CASE" ||
				stepInstance.workflow_instance.ref_id !== caseId
			) {
				return new NextResponse("Workflow instance mismatch", {
					status: 400,
				});
			}

			workflowStep = stepInstance.step;

			if (workflowStep.case_step_id) {
				caseStep = await prisma.case_step.findUnique({
					where: { id: workflowStep.case_step_id },
				});
			} else {
				return new NextResponse(
					"Workflow step has no case_step mapping",
					{
						status: 400,
					}
				);
			}
		} else if (workflowStepId) {
			workflowStep = await prisma.workflow_step.findUnique({
				where: { id: workflowStepId },
			});

			if (!workflowStep || !workflowStep.case_step_id) {
				return new NextResponse(
					"Invalid workflowStepId or no mapping",
					{
						status: 400,
					}
				);
			}

			caseStep = await prisma.case_step.findUnique({
				where: { id: workflowStep.case_step_id },
			});
		} else {
			// Fallback: find active workflow instance
			const wfInst = await prisma.workflow_instance.findUnique({
				where: {
					ref_type_ref_id: {
						ref_type: "PROCUREMENT_CASE",
						ref_id: caseId,
					},
				},
			});

			if (!wfInst || !wfInst.current_step_id) {
				return new NextResponse("No active workflow step", {
					status: 400,
				});
			}

			workflowStep = await prisma.workflow_step.findUnique({
				where: { id: wfInst.current_step_id },
			});

			if (workflowStep?.case_step_id) {
				caseStep = await prisma.case_step.findUnique({
					where: { id: workflowStep.case_step_id },
				});
			}
		}

		if (!caseStep) {
			return new NextResponse("Could not determine case step", {
				status: 400,
			});
		}

		// 4. Load requirements
		const requirements = await prisma.step_requirement.findMany({
			where: {
				step_id: caseStep.id,
				is_active: true,
			},
			// include: {
			// 	master_doc_type: true, // Include doc type logic to get name
			// },
			orderBy: {
				sort_order: "asc",
			},
		});

		if (requirements.length === 0) {
			return NextResponse.json({
				caseId,
				workflowStep: workflowStep
					? { id: workflowStep.id, stepKey: workflowStep.step_key }
					: null,
				caseStep: { id: caseStep.id, name: caseStep.name },
				summary: {
					requiredTotal: 0,
					passed: 0,
					missing: 0,
					isComplete: true,
				},
				items: [],
			});
		}

		// 5. Preload documents for AUTO checks
		const docTypeIds = requirements
			.filter((r) => r.doc_type_id !== null)
			.map((r) => r.doc_type_id as string);
		const uniqueDocTypeIds = Array.from(new Set(docTypeIds));

		let latestDocs: any[] = [];
		if (uniqueDocTypeIds.length > 0) {
			latestDocs = await prisma.document.findMany({
				where: {
					ref_type: "PROCUREMENT_CASE",
					ref_id: caseId,
					is_latest: true,
					doc_type_id: { in: uniqueDocTypeIds },
					is_active: true,
				},
				orderBy: {
					created_at: "desc",
				},
			});
		}

		const docByType: Record<string, any> = {};
		for (const doc of latestDocs) {
			if (!docByType[doc.doc_type_id]) {
				docByType[doc.doc_type_id] = doc;
			}
		}

		// 6. Load saved manual checks
		const reqIds = requirements.map((r) => r.id);
		const checks = await prisma.case_requirement_check.findMany({
			where: {
				case_id: caseId,
				requirement_id: { in: reqIds },
			},
		});

		const checkByReqId: Record<string, any> = {};
		for (const check of checks) {
			checkByReqId[check.requirement_id] = check;
		}

		// 7. Compute statuses
		const items = [];
		let passedRequired = 0;
		const requiredTotal = requirements.filter((r) => r.is_required).length;
		let missingRequired = 0;

		for (const req of requirements) {
			let status = "PENDING";
			let evidence = null;
			let notes = null;
			const mode = req.check_mode;

			if (mode === "AUTO") {
				if (!req.doc_type_id) {
					status = "FAIL";
				} else {
					const doc = docByType[req.doc_type_id];
					if (doc && (doc.file_url || doc.sp_web_url)) {
						status = "PASS";
						if (includeDocs) {
							evidence = {
								documentId: doc.id,
								fileUrl: doc.file_url ?? doc.sp_web_url,
								fileName: doc.file_name,
								mimeType: doc.mime_type,
							};
						}
					} else {
						status = "FAIL";
					}
				}
			} else if (mode === "MANUAL") {
				const saved = checkByReqId[req.id];
				if (saved) {
					status = saved.status;
					notes = saved.notes;
					if (includeDocs && saved.evidence_document_id) {
						const evDoc = await prisma.document.findUnique({
							where: { id: saved.evidence_document_id },
						});
						if (evDoc) {
							evidence = {
								documentId: evDoc.id,
								fileUrl: evDoc.file_url ?? evDoc.sp_web_url,
								fileName: evDoc.file_name,
								mimeType: evDoc.mime_type,
							};
						}
					}
				} else {
					status = "PENDING";
				}
			}

			// Count gating
			if (req.is_required) {
				if (status === "PASS") {
					passedRequired++;
				} else {
					missingRequired++;
				}
			}

			items.push({
				requirementId: req.id,
				name: req.name,
				required: req.is_required,
				mode: req.check_mode,
				status,
				docTypeId: req.doc_type_id,
				// docTypeName: req.master_doc_type?.name,
				evidence,
				notes,
			});
		}

		return NextResponse.json({
			caseId,
			workflowStep: workflowStep
				? { id: workflowStep.id, stepKey: workflowStep.step_key }
				: null,
			caseStep: { id: caseStep.id, name: caseStep.name },
			summary: {
				requiredTotal,
				passed: passedRequired,
				missing: missingRequired,
				isComplete: missingRequired === 0,
			},
			items,
		});
	} catch (error) {
		console.error("Error fetching checklist:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
