import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	// 1️⃣ Permission
	const canCreate = await hasPermission("create", "workflow_steps");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	// 2️⃣ Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { workflowId } = await params;
	const body = await req.json();

	// Normalize to array
	const stepsToCreate = Array.isArray(body) ? body : [body];

	return prisma
		.$transaction(async (tx) => {
			// 3️⃣ Ensure workflow exists & editable
			const workflow = await tx.workflow.findUnique({
				where: { id: workflowId },
			});

			if (!workflow) {
				return new NextResponse("Workflow not found", { status: 404 });
			}

			if (workflow.is_active) {
				return new NextResponse("Cannot modify active workflow", {
					status: 409,
				});
			}

			// 3.5 Delete existing steps
			await tx.workflow_step.deleteMany({
				where: { workflow_id: workflowId },
			});

			const createdSteps = [];

			for (const stepData of stepsToCreate) {
				const {
					step_key,
					name,
					step_order,
					approver_strategy,
					approver_value,
					approval_mode = "ANY",
					can_send_back = true,
					reject_target_type,
					reject_target_step_id,
					is_terminal = false,
				} = stepData;

				// 4️⃣ Basic validation
				if (
					!step_key ||
					!name ||
					step_order === undefined ||
					!approver_strategy ||
					!approver_value ||
					!reject_target_type
				) {
					throw new Error(
						`Invalid payload for step ${step_key || "unknown"}`
					);
				}

				if (
					reject_target_type === "SPECIFIC" &&
					!reject_target_step_id
				) {
					// Validate specific reject target if needed
				}

				// 5️⃣ Uniqueness checks
				const conflict = await tx.workflow_step.findFirst({
					where: {
						workflow_id: workflowId,
						OR: [{ step_key }, { step_order }],
					},
				});

				if (conflict) {
					throw new Error(
						`Step key '${step_key}' or order '${step_order}' already exists`
					);
				}

				// 6️⃣ Only one terminal step allowed
				if (is_terminal) {
					const existingTerminal = await tx.workflow_step.findFirst({
						where: {
							workflow_id: workflowId,
							is_terminal: true,
						},
					});

					if (existingTerminal) {
						throw new Error("Workflow already has a terminal step");
					}
				}

				// 7️⃣ Create step
				const newStep = await tx.workflow_step.create({
					data: {
						workflow_id: workflowId,
						step_key,
						step_order,
						name,
						approver_strategy,
						// Convert array to JSON string
						approver_value: JSON.stringify(approver_value),
						approval_mode,
						can_send_back,
						reject_target_type,
						reject_target_step_id: reject_target_step_id ?? null,
						is_terminal,
					},
				});
				createdSteps.push(newStep);
			}

			return NextResponse.json(createdSteps, { status: 201 });
		})
		.catch((error) => {
			return new NextResponse(error.message || "Internal Server Error", {
				status: 400,
			});
		});
}

export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	const { workflowId } = await params;
	const steps = await prisma.workflow_step.findMany({
		where: { workflow_id: workflowId },
		orderBy: { step_order: "asc" },
	});

	// Parse valid JSON strings back to CSV for frontend compatibility
	const processedSteps = steps.map((s) => {
		let val = s.approver_value;
		try {
			const parsed = JSON.parse(val);
			if (Array.isArray(parsed)) {
				val = parsed.join(",");
			}
		} catch (e) {
			// Not JSON, keep as is
		}
		return { ...s, approver_value: val };
	});

	return NextResponse.json(processedSteps);
}
