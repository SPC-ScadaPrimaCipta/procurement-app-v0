import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userRoles = (session.user as any).roles || [];

	try {
		const count = await prisma.notification.count({
			where: {
				OR: [
					{
						recipient_type: "USER",
						recipient_id: session.user.id,
					},
					{
						recipient_type: "ROLE",
						recipient_id: { in: userRoles },
					},
				],
				read_at: null,
				archived_at: null,
			},
		});

		return NextResponse.json({ count });
	} catch (error) {
		console.error("Error fetching unread count:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
