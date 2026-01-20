import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ workflowId: string; stepId: string }> },
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { workflowId, stepId } = await params;

	// 1️⃣ Permissions
	const canEdit = await hasPermission("edit", "workflow_steps");
	if (!canEdit) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const body = await req.json();
		const { requirements } = body;

		if (!Array.isArray(requirements)) {
			return new NextResponse("Invalid payload", { status: 400 });
		}

		// 2️⃣ Verify Workflow Step exists
		const step = await prisma.workflow_step.findUnique({
			where: { id: stepId },
			include: { case_step: true },
		});

		if (!step || step.workflow_id !== workflowId) {
			return new NextResponse("Step not found", { status: 404 });
		}

		let caseStepId = step.case_step_id;

		if (!caseStepId) {
			return new NextResponse("Step not mapped to a case step", {
				status: 404,
			});
		}

		// 3️⃣ Transaction upsert requirements
		await prisma.$transaction(async (tx) => {
			// Get valid incoming IDs
			const incomingIds = requirements
				.filter((r: any) => r.id)
				.map((r: any) => r.id);

			// Soft delete removed items (set is_active = false)
			await tx.step_requirement.updateMany({
				where: {
					step_id: caseStepId!,
					id: { notIn: incomingIds },
					is_active: true, // only if currently active
				},
				data: { is_active: false },
			});

			// Upsert items
			for (const [index, req] of requirements.entries()) {
				if (req.id) {
					// Update existing
					await tx.step_requirement.update({
						where: { id: req.id },
						data: {
							name: req.name,
							doc_type_id: req.docTypeId || null,
							check_mode: req.mode || "AUTO",
							is_required: req.required !== false,
							sort_order: index,
							is_active: true, // ensure active if re-added
							updated_at: new Date(),
						},
					});
				} else {
					// Create new
					await tx.step_requirement.create({
						data: {
							step_id: caseStepId!,
							name: req.name,
							doc_type_id: req.docTypeId || null,
							check_mode: req.mode || "AUTO",
							is_required: req.required !== false,
							sort_order: index,
							created_by: session.user.id,
							is_active: true,
						},
					});
				}
			}
		});

		return NextResponse.json({ success: true });
	} catch (err: any) {
		console.error(err);
		return new NextResponse(err.message || "Internal Error", {
			status: 500,
		});
	}
}
