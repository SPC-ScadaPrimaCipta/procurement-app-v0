import prisma from "@/lib/prisma";
import { resolveUserName } from "@/lib/user-utils";
import { resolveApprovers } from "@/lib/workflow/resolver";

export interface WorkflowTrackItem {
	stepNumber: number;
	title: string;
	approverName: string;
	approverStrategy: string;
	status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
	approvedAt?: Date | null;
	isLast: boolean;
}

interface WorkflowDataResult {
	currentStepInstanceId: string | null;
	workflowTrack: WorkflowTrackItem[];
}

/**
 * Fetches the current workflow state and history for a given reference (e.g., PROCUREMENT_CASE).
 *
 * @param refType The reference type (e.g., "PROCUREMENT_CASE")
 * @param refId The reference ID (e.g., the UUID of the case)
 * @param userId Optional: The current user's ID to check for pending assignments
 */
export async function getWorkflowData(
	refType: string,
	refId: string,
	userId?: string
): Promise<WorkflowDataResult> {
	let currentStepInstanceId = null;
	let workflowTrack: WorkflowTrackItem[] = [];

	const workflowInstance = await prisma.workflow_instance.findUnique({
		where: {
			ref_type_ref_id: {
				ref_type: refType,
				ref_id: refId,
			},
		},
		include: {
			workflow_step_instance: true,
		},
	});

	if (workflowInstance) {
		// 1. Determine current step instance for user action
		if (userId) {
			const stepInstances =
				workflowInstance.workflow_step_instance.filter(
					(step) => step.status === "PENDING"
				);

			const assignment = stepInstances.find((step) => {
				const assigned = step.assigned_to;
				let assignedArr: string[] = [];
				if (typeof assigned === "string") {
					try {
						assignedArr = JSON.parse(assigned);
					} catch {
						assignedArr = [assigned];
					}
				} else if (Array.isArray(assigned)) {
					assignedArr = assigned as string[];
				}

				return assignedArr.includes(userId);
			});

			if (assignment) {
				currentStepInstanceId = assignment.id;
			}
		}

		// 2. Build Workflow Track
		const workflowSteps = await prisma.workflow_step.findMany({
			where: { workflow_id: workflowInstance.workflow_id },
			orderBy: { step_order: "asc" },
		});

		workflowTrack = await Promise.all(
			workflowSteps.map(async (step) => {
				const instance = workflowInstance.workflow_step_instance.find(
					(i) => i.step_id === step.id
				);

				let approverName = "-";

				if (instance?.acted_by) {
					approverName = await resolveUserName(instance.acted_by);
				} else {
					// Use standard resolver
					try {
						// We might need to fetch full context depending on strategy,
						// but for now passing refId covers many cases.
						const approverIds = await resolveApprovers(step, {
							id: refId,
							ref_id: refId, // Some resolvers might use this
						});

						if (approverIds && approverIds.length > 0) {
							const names = await Promise.all(
								approverIds.map((id) => resolveUserName(id))
							);
							approverName = names.join(", ");
						} else {
							// Fallback visualization if no users resolved yet (e.g. dynamic future)
							if (step.approver_strategy === "ROLE") {
								// Try to get role name?
								// resolveApprovers for ROLE returns user IDs.
								// If empty, maybe no users in that role?
								// Let's just show strategy value if empty.
								approverName = String(step.approver_value);
							} else {
								approverName =
									step.approver_strategy.charAt(0) +
									step.approver_strategy
										.slice(1)
										.toLowerCase();
							}
						}
					} catch (e) {
						console.error("Failed to resolve approvers", e);
						approverName = "Error resolving";
					}
				}

				return {
					stepNumber: step.step_order,
					title: step.name,
					approverName,
					approverStrategy: step.approver_strategy,
					status: (instance
						? instance.status
						: "PENDING") as WorkflowTrackItem["status"],
					approvedAt: instance?.acted_at || null,
					isLast: step.is_terminal,
				};
			})
		);
	}

	return {
		currentStepInstanceId,
		workflowTrack,
	};
}
