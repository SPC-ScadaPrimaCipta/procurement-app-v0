import prisma from "@/lib/prisma";

export async function resolveRole(roleCode: string): Promise<string[]> {
	let targetRoles = [roleCode];

	// Handle case where roleCode is stored as a JSON array string, e.g. '["KPA"]'
	if (roleCode.trim().startsWith("[") && roleCode.trim().endsWith("]")) {
		try {
			const parsed = JSON.parse(roleCode);
			if (Array.isArray(parsed)) {
				targetRoles = parsed;
			}
		} catch (e) {
			// Not valid JSON, process as single string
		}
	}

	const users = await prisma.user.findMany({
		where: {
			roles: {
				some: {
					name: { in: targetRoles },
				},
			},
		},
		select: { id: true },
	});

	if (users.length === 0) {
		throw new Error(`No users found for role(s) ${targetRoles.join(", ")}`);
	}

	return users.map((u) => u.id);
}
