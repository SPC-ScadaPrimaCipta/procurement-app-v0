import prisma from "@/lib/prisma";

/**
 * Helper function to check if a user is assigned to a task/workflow step.
 * It supports checking against specific user IDs, user objects, or roles.
 *
 * @param assignedTo - The assignment payload, which can be:
 *   1) Array of strings: ["userId1", "userId2"]
 *   2) Array of objects: [{type: "USER", id: "..."}, {type: "ROLE", name: "KPA"}]
 *   3) Array of role strings: ["ROLE:KPA", "ROLE:PPK"]
 * @param user - The user object containing 'id' and 'roles'.
 * @returns true if the user matches any assignment, false otherwise.
 */
export function isUserAssigned(assignedTo: any, user: any): boolean {
	if (!assignedTo) return false;

	const list = Array.isArray(assignedTo) ? assignedTo : [];

	const userId = user.id;
	const roles = ((user as any).roles || []).map((r: string) =>
		r.toLowerCase(),
	);

	// 1) ["userId1","userId2"] - Simple string match (User IDs)
	if (list.some((x) => typeof x === "string" && x === userId)) return true;

	// 2) [{type:"USER", id:"..."}, {type:"ROLE", name:"KPA"}] - Object structure
	for (const item of list) {
		if (!item || typeof item !== "object") continue;
		if (item.type === "USER" && item.id === userId) return true;
		if (
			item.type === "ROLE" &&
			item.name &&
			roles.includes(String(item.name).toLowerCase())
		)
			return true;
	}

	// 3) ["ROLE:KPA"] - Role string format
	if (
		list.some(
			(x) => typeof x === "string" && x.toLowerCase().startsWith("role:"),
		)
	) {
		const roleTokens = list
			.filter((x) => typeof x === "string")
			.map((x: string) => x.toLowerCase().replace("role:", ""));
		if (roleTokens.some((rt) => roles.includes(rt))) return true;
	}

	return false;
}

/**
 * Checks if a user is assigned to a specific workflow step instance by ID.
 * Fetches the step instance from DB and checks assignment.
 */
export async function checkUserAssignmentByStepId(
	workflowStepInstanceId: string,
	user: { id: string; roles?: string[] } | any,
): Promise<boolean> {
	try {
		const step = await prisma.workflow_step_instance.findUnique({
			where: { id: workflowStepInstanceId },
			select: { assigned_to: true },
		});

		if (!step) return false;

		return isUserAssigned(step.assigned_to, user);
	} catch (error) {
		console.error("Error checking user assignment:", error);
		return false;
	}
}
