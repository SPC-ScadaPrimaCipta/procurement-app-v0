import prisma from "@/lib/prisma";
import { DYNAMIC_RESOLVERS } from "../dynamic-registry";

export async function resolveDynamic(
	key: string,
	context: any
): Promise<string[]> {
	if (!DYNAMIC_RESOLVERS[key as keyof typeof DYNAMIC_RESOLVERS]) {
		throw new Error(`Unknown dynamic resolver: ${key}`);
	}
	switch (key) {
		// case "MANAGER_OF_SUBMITTER": {
		// 	const user = await prisma.user.findUnique({
		// 		where: { id: context.submitterId },
		// 		select: { manager_id: true },
		// 	});

		// 	if (!user?.manager_id) {
		// 		throw new Error("Submitter has no manager");
		// 	}

		// 	return [user.manager_id];
		// }

		case "PIC_SELECTED": {
			const lastAction = await prisma.workflow_action_log.findFirst({
				where: {
					workflow_instance_id: context.workflowInstanceId,
				},
				orderBy: {
					created_at: "desc",
				},
			});

			const pic = (lastAction?.metadata as any)?.selected_pic;
			if (!pic) {
				throw new Error("PIC not selected in previous step");
			}

			return [pic];
		}

		default:
			throw new Error(`Unknown dynamic resolver: ${key}`);
	}
}
