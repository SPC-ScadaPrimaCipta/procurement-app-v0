import { resolveUser } from "./user";
import { resolveRole } from "./role";
import { resolveDynamic } from "./dynamic";
import { resolveMulti } from "./multi";

export async function resolveApprovers(
	stepDef: any,
	context: any
): Promise<string[]> {
	switch (stepDef.approver_strategy) {
		case "USER":
			return resolveUser(stepDef.approver_value, context);

		case "ROLE":
			return resolveRole(stepDef.approver_value);

		case "DYNAMIC":
			return resolveDynamic(stepDef.approver_value, context);

		case "MULTI":
			return resolveMulti(stepDef.approver_value, context);

		default:
			throw new Error(
				`Unsupported approver strategy: ${stepDef.approver_strategy}`
			);
	}
}
