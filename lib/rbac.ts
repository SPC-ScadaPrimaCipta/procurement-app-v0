import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

async function getUserRolesAndPermissions(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		include: {
			roles: {
				include: {
					permissions: true,
				},
			},
		},
	});

	if (!user) return { roles: [], permissions: [] };

	const roles = user.roles.map((r) => r.name);
	const permissions = new Set(
		user.roles.flatMap((r) =>
			r.permissions.map((p) => `${p.action}:${p.resource}`)
		)
	);

	return { roles, permissions: Array.from(permissions) };
}

export async function hasPermission(action: string, resource: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return false;

	const { roles, permissions } = await getUserRolesAndPermissions(
		session.user.id
	);

	// Superadmin bypass
	if (roles.includes("superadmin")) {
		return true;
	}

	const requiredPermission = `${action}:${resource}`;

	return (
		permissions.includes(requiredPermission) ||
		permissions.includes("manage:all")
	);
}

export async function hasRole(role: string) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return false;

	const { roles } = await getUserRolesAndPermissions(session.user.id);
	return roles.includes(role);
}
