import "dotenv/config";
import prisma from "@/lib/prisma";

const USER_ID = "cB9CGCnhynovKnXZSFyx6S8XR7vNAEB9"; // The ID you provided

async function main() {
	console.log(`Assigning superadmin role to user ${USER_ID}...`);

	const superAdminRole = await prisma.role.findUnique({
		where: { name: "superadmin" },
	});

	if (!superAdminRole) {
		console.error("Superadmin role not found! Did you run the seed?");
		return;
	}

	await prisma.user.update({
		where: { id: USER_ID },
		data: {
			roles: {
				connect: { id: superAdminRole.id },
			},
		},
	});

	console.log("Successfully assigned superadmin role to the user.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
