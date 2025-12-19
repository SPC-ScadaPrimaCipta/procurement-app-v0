import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveApprovers } from "@/lib/workflow/resolver";

export async function POST(req: Request) {
	// 1️⃣ Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;
	const { stepInstanceId, comment, metadata } = await req.json();

	if (!stepInstanceId) {
		return new NextResponse("stepInstanceId required", { status: 400 });
	}

	return prisma.$transaction(async (tx) => {
		// 2️⃣ Load step instance with relations
		const stepInstance = await tx.workflow_step_instance.findUnique({
			where: { id: stepInstanceId },
			include: {
				workflow_instance: true,
				step: true,
			},
		});

		if (!stepInstance) {
			return new NextResponse("Step instance not found", { status: 404 });
		}

		if (stepInstance.status !== "PENDING") {
			return new NextResponse("Step is not pending", { status: 409 });
		}

		// 3️⃣ Authorization: must be assigned
		const assigned = stepInstance.assigned_to as string[];
		if (!assigned.includes(userId)) {
			return new NextResponse("Not assigned to this step", {
				status: 403,
			});
		}

		// 4️⃣ Approve step instance
		await tx.workflow_step_instance.update({
			where: { id: stepInstanceId },
			data: {
				status: "APPROVED",
				acted_by: userId,
				acted_at: new Date(),
				comment,
			},
		});

		// 5️⃣ Log action
		await tx.workflow_action_log.create({
			data: {
				workflow_instance_id: stepInstance.workflow_instance_id,
				action: "APPROVE",
				from_step_id: stepInstance.step_id,
				actor_id: userId,
				comment,
				metadata,
			},
		});

		// 6️⃣ Load workflow steps (definition)
		const steps = await tx.workflow_step.findMany({
			where: {
				workflow_id: stepInstance.workflow_instance.workflow_id,
			},
			orderBy: { step_order: "asc" },
		});

		// 7️⃣ Find next step
		const currentIndex = steps.findIndex(
			(s) => s.id === stepInstance.step_id
		);

		const nextStep = steps[currentIndex + 1];

		// 8️⃣ If no next step or terminal → complete workflow
		if (!nextStep || nextStep.is_terminal) {
			await tx.workflow_instance.update({
				where: { id: stepInstance.workflow_instance_id },
				data: {
					status: "APPROVED",
					current_step_id: null,
				},
			});

			return NextResponse.json({
				status: "COMPLETED",
			});
		}

		// 9️⃣ Resolve approvers for next step
		const assignedUsers = await resolveApprovers(nextStep, {
			workflowInstanceId: stepInstance.workflow_instance_id,
			workflowId: stepInstance.workflow_instance.workflow_id,
			submitterId: stepInstance.workflow_instance.created_by,
			refType: stepInstance.workflow_instance.ref_type,
			refId: stepInstance.workflow_instance.ref_id,
		});

		if (!assignedUsers.length) {
			throw new Error("No approvers resolved");
		}

		// 🔟 Create next step instance
		await tx.workflow_step_instance.create({
			data: {
				workflow_instance_id: stepInstance.workflow_instance_id,
				step_id: nextStep.id,
				status: "PENDING",
				assigned_to: assignedUsers,
			},
		});

		// 1️⃣1️⃣ Move pointer
		await tx.workflow_instance.update({
			where: { id: stepInstance.workflow_instance_id },
			data: {
				current_step_id: nextStep.id,
			},
		});

		return NextResponse.json({
			status: "IN_PROGRESS",
			nextStep: {
				stepKey: nextStep.step_key,
				assignedTo: assignedUsers,
			},
		});
	});
}
