import prisma from "@/lib/prisma";
import { resolveApprovers } from "@/lib/workflow/resolver";

interface StartWorkflowOptions {
	workflowCode: string;
	refType: string;
	refId: string;
	userId: string;
}

/**
 * Starts a new workflow instance for a given reference.
 * Finds the latest active version of the workflow definition by code.
 */
export async function startWorkflow({
	workflowCode,
	refType,
	refId,
	userId,
}: StartWorkflowOptions) {
	return prisma.$transaction(async (tx) => {
		// 1. Resolve active workflow
		const workflow = await tx.workflow.findFirst({
			where: {
				code: workflowCode,
				is_active: true,
			},
			include: {
				workflow_step: {
					orderBy: { step_order: "asc" },
				},
			},
		});

		if (!workflow) {
			throw new Error(`Workflow not found for code: ${workflowCode}`);
		}

		// 2. Prevent duplicate workflow per ref
		const existing = await tx.workflow_instance.findFirst({
			where: {
				ref_type: refType,
				ref_id: refId,
			},
		});

		if (existing) {
			// You might want to return the existing one or throw
			throw new Error("Workflow already exists for this reference");
		}

		// 3. Fetch first step
		const firstStep = workflow.workflow_step[0];

		if (!firstStep) {
			throw new Error("Workflow has no steps defined");
		}

		// 4. Create workflow instance
		const instance = await tx.workflow_instance.create({
			data: {
				workflow_id: workflow.id,
				workflow_version: workflow.version,
				ref_type: refType,
				ref_id: refId,
				status: "IN_PROGRESS",
				current_step_id: firstStep.id,
				created_by: userId,
			},
		});

		if (!instance) {
			throw new Error("Failed to create workflow instance");
		}

		// 5. Log submit action
		await tx.workflow_action_log.create({
			data: {
				workflow_instance_id: instance.id,
				action: "SUBMIT",
				from_step_id: null,
				actor_id: userId,
				to_step_id: firstStep.id,
			},
		});

		// 6. Resolve approvers
		const assignedUsers = await resolveApprovers(firstStep, {
			workflowInstance: instance,
			submitterId: userId,
			refType,
			refId,
		});

		// 7. Create first pending step
		await tx.workflow_step_instance.create({
			data: {
				workflow_instance_id: instance.id,
				step_id: firstStep.id,
				status: "PENDING",
				assigned_to: assignedUsers,
			},
		});

		// 8. Move pointer
		await tx.workflow_instance.update({
			where: { id: instance.id },
			data: {
				current_step_id: firstStep.id,
			},
		});

		return {
			instanceId: instance.id,
			status: "IN_PROGRESS",
			currentStep: {
				stepKey: firstStep.step_key,
				name: firstStep.name,
				assignedTo: assignedUsers,
			},
		};
	});
}
