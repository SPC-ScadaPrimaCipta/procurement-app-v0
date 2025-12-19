import { workflow_step } from "@/generated/prisma/client";

/**
 * Resolve which step a SEND_BACK should go to
 */
export function resolveSendBackStep(
	currentStep: workflow_step,
	steps: workflow_step[],
	currentIndex: number
): workflow_step {
	switch (currentStep.reject_target_type) {
		case "PREVIOUS": {
			if (currentIndex <= 0) {
				throw new Error("No previous step to send back to");
			}
			return steps[currentIndex - 1];
		}

		case "SUBMITTER": {
			return steps[0];
		}

		case "SPECIFIC": {
			if (!currentStep.reject_target_step_id) {
				throw new Error("reject_target_step_id is not set");
			}
			const target = steps.find(
				(s) => s.id === currentStep.reject_target_step_id
			);
			if (!target) {
				throw new Error("Target step not found");
			}
			return target;
		}

		default:
			throw new Error("Unsupported reject_target_type");
	}
}
