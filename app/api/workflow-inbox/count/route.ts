import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;

	try {
		// Only count pending tasks
		// Same WHERE logic as main inbox for type="pending"
		const count = await prisma.workflow_step_instance.count({
			where: {
				status: "PENDING",
				OR: [
					{
						assigned_to: {
							array_contains: userId,
						},
					},
					{
						assigned_to: {
							array_contains: JSON.stringify([userId]),
						},
					},
				],
				workflow_instance: {
					status: "IN_PROGRESS",
				},
			},
		});

		return NextResponse.json({ count });
	} catch (error) {
		console.error("Error counting inbox items:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
