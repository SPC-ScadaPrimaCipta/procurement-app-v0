import "dotenv/config";
import prisma from "@/lib/prisma";

async function main() {
	console.log("Seeding database...");

	// Create Superadmin Role
	const superAdminRole = await prisma.role.upsert({
		where: { name: "superadmin" },
		update: {},
		create: {
			name: "superadmin",
			description: "Super Administrator with full access",
		},
	});

	console.log("Superadmin role created:", superAdminRole.name);

	// Create basic permissions
	const permissions = [
		{ action: "manage", resource: "all", description: "Manage everything" },
		{ action: "read", resource: "users", description: "View users" },
		{ action: "manage", resource: "users", description: "Manage users" },
		{ action: "read", resource: "roles", description: "View roles" },
		{ action: "manage", resource: "roles", description: "Manage roles" },
		{
			action: "read",
			resource: "workflows",
			description: "View workflows",
		},
		{
			action: "manage",
			resource: "workflows",
			description: "Manage workflows",
		},
	];

	for (const perm of permissions) {
		await prisma.permission.upsert({
			where: {
				action_resource: {
					action: perm.action,
					resource: perm.resource,
				},
			},
			update: {},
			create: perm,
		});
	}

	console.log("Permissions seeded.");

	// Assign 'manage:all' to Superadmin
	const manageAllPerm = await prisma.permission.findUnique({
		where: {
			action_resource: {
				action: "manage",
				resource: "all",
			},
		},
	});

	if (manageAllPerm) {
		await prisma.role.update({
			where: { id: superAdminRole.id },
			data: {
				permissions: {
					connect: { id: manageAllPerm.id },
				},
			},
		});
		console.log("Assigned 'manage:all' to Superadmin.");
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
