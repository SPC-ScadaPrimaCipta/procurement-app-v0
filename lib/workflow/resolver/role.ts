import prisma from "@/lib/prisma";

export async function resolveRole(roleCode: string): Promise<string[]> {
	const users = await prisma.user.findMany({
		where: {
			roles: {
				some: {
					name: roleCode,
				},
			},
		},
		select: { id: true },
	});

	if (users.length === 0) {
		throw new Error(`No users found for role ${roleCode}`);
	}

	return users.map((u) => u.id);
}
