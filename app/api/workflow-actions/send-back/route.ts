import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { resolveApprovers } from "@/lib/workflow/resolver";
import { resolveSendBackStep } from "@/lib/workflow/resolver/send-back";

export async function POST(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;
	const { stepInstanceId, comment } = await req.json();

	return prisma.$transaction(async (tx) => {
		const stepInstance = await tx.workflow_step_instance.findUnique({
			where: { id: stepInstanceId },
			include: {
				workflow_instance: true,
				step: true,
			},
		});

		if (!stepInstance) {
			return new NextResponse("Not found", { status: 404 });
		}

		if (stepInstance.status !== "PENDING") {
			return new NextResponse("Step not pending", { status: 409 });
		}

		if (!stepInstance.step.can_send_back) {
			return new NextResponse("Send-back not allowed", { status: 403 });
		}

		const assigned = stepInstance.assigned_to as string[];
		if (!assigned.includes(userId)) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		// 1️⃣ Close current step
		await tx.workflow_step_instance.update({
			where: { id: stepInstanceId },
			data: {
				status: "REJECTED",
				acted_by: userId,
				acted_at: new Date(),
				comment,
			},
		});

		// 2️⃣ Load workflow steps
		const steps = await tx.workflow_step.findMany({
			where: { workflow_id: stepInstance.workflow_instance.workflow_id },
			orderBy: { step_order: "asc" },
		});

		const currentIndex = steps.findIndex(
			(s) => s.id === stepInstance.step_id
		);

		if (currentIndex === -1) {
			throw new Error("Step definition not found");
		}

		const targetStep = resolveSendBackStep(
			stepInstance.step,
			steps,
			currentIndex
		);

		if (!targetStep) {
			throw new Error("Invalid send-back target");
		}

		// 4️⃣ Resolve approvers again
		const assignedUsers = await resolveApprovers(targetStep, {
			workflowInstanceId: stepInstance.workflow_instance_id,
			workflowId: stepInstance.workflow_instance.workflow_id,
			submitterId: stepInstance.workflow_instance.created_by,
			refType: stepInstance.workflow_instance.ref_type,
			refId: stepInstance.workflow_instance.ref_id,
		});

		// 5️⃣ Create new step instance
		await tx.workflow_step_instance.create({
			data: {
				workflow_instance_id: stepInstance.workflow_instance_id,
				step_id: targetStep.id,
				status: "PENDING",
				assigned_to: assignedUsers,
			},
		});

		// 6️⃣ Move pointer
		await tx.workflow_instance.update({
			where: { id: stepInstance.workflow_instance_id },
			data: {
				status: "IN_PROGRESS",
				current_step_id: targetStep.id,
			},
		});

		// 7️⃣ Log action
		await tx.workflow_action_log.create({
			data: {
				workflow_instance_id: stepInstance.workflow_instance_id,
				action: "SEND_BACK",
				from_step_id: stepInstance.step_id,
				to_step_id: targetStep.id,
				actor_id: userId,
				comment,
			},
		});

		return NextResponse.json({
			status: "SENT_BACK",
			targetStep: targetStep.step_key,
		});
	});
}
