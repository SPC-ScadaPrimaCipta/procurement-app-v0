import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function GET(
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

	try {
		const step = await prisma.workflow_step.findUnique({
			where: { id: stepId },
			include: {
				case_step: {
					include: {
						step_requirement: {
							orderBy: { sort_order: "asc" },
							include: {
								master_doc_type: true,
							},
						},
					},
				},
			},
		});

		if (!step || step.workflow_id !== workflowId) {
			return new NextResponse("Step not found", { status: 404 });
		}

		// Logic to resolve approvers (Dry up if reused often)
		let resolved_approvers: any[] = [];
		let val = step.approver_value;
		let parsedValues: string[] = [];

		try {
			const parsed = JSON.parse(val);
			if (Array.isArray(parsed)) {
				parsedValues = parsed;
			} else {
				parsedValues = [String(parsed)];
			}
		} catch {
			parsedValues = [val];
		}

		if (step.approver_strategy === "USER") {
			const users = await prisma.user.findMany({
				where: { id: { in: parsedValues } },
				select: { id: true, name: true, email: true },
			});
			resolved_approvers = users;
		} else if (step.approver_strategy === "ROLE") {
			const roles = await prisma.role.findMany({
				where: {
					OR: [
						{ name: { in: parsedValues } },
						{ id: { in: parsedValues } },
					],
				},
				select: { id: true, name: true, description: true },
			});
			resolved_approvers = roles;
		}

		return NextResponse.json({
			...step,
			resolved_approvers,
		});
	} catch (error: any) {
		console.error("Error fetching step:", error);
		return new NextResponse(error.message || "Internal Server Error", {
			status: 500,
		});
	}
}

export async function PATCH(
	req: Request,
	{ params }: { params: Promise<{ workflowId: string; stepId: string }> },
) {
	// 1️⃣ Permission
	const canEdit = await hasPermission("edit", "workflow_steps");
	if (!canEdit) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	// 2️⃣ Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const { workflowId, stepId } = await params;
	const body = await req.json();

	const {
		step_key,
		name,
		step_order, // Usually not updated here, but possible
		approver_strategy,
		approver_value,
		approval_mode,
		can_send_back,
		reject_target_type,
		reject_target_step_id,
		is_terminal,
	} = body;

	try {
		// 3️⃣ Ensure step exists and belongs to workflow
		const existingStep = await prisma.workflow_step.findUnique({
			where: { id: stepId },
		});

		if (!existingStep || existingStep.workflow_id !== workflowId) {
			return new NextResponse("Step not found", { status: 404 });
		}

		// 4️⃣ Update
		const updatedStep = await prisma.workflow_step.update({
			where: { id: stepId },
			data: {
				step_key,
				name,
				step_order,
				approver_strategy,
				approver_value:
					typeof approver_value === "object"
						? JSON.stringify(approver_value)
						: approver_value,
				approval_mode,
				can_send_back,
				reject_target_type,
				reject_target_step_id:
					reject_target_step_id === "" ? null : reject_target_step_id, // Handle empty string
				is_terminal,
			},
		});

		return NextResponse.json(updatedStep);
	} catch (error: any) {
		console.error("Error updating step:", error);
		return new NextResponse(error.message || "Internal Server Error", {
			status: 500,
		});
	}
}

export async function DELETE(
	req: Request,
	{ params }: { params: Promise<{ workflowId: string; stepId: string }> },
) {
	const canDelete = await hasPermission("delete", "workflow_steps");
	if (!canDelete) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { workflowId, stepId } = await params;

	try {
		await prisma.workflow_step.delete({
			where: { id: stepId, workflow_id: workflowId },
		});
		return new NextResponse(null, { status: 204 });
	} catch (error: any) {
		console.error("Error deleting step:", error);
		return new NextResponse(error.message || "Internal Server Error", {
			status: 500,
		});
	}
}
