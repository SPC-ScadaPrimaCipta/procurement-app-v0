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

	const { searchParams } = new URL(req.url);
	const unreadOnly = searchParams.get("unreadOnly") !== "false"; // default true
	const limit = parseInt(searchParams.get("limit") || "10");
	const cursor = searchParams.get("cursor");

	// Safely access roles from session (injected by customSession)
	const userRoles = (session.user as any).roles || [];

	const whereClause: any = {
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
		archived_at: null, // Exclude archived notifications by default
	};

	if (unreadOnly) {
		whereClause.read_at = null;
	}

	try {
		const notifications = await prisma.notification.findMany({
			where: whereClause,
			take: limit + 1, // Fetch one extra to determine if there's a next page
			skip: cursor ? 1 : 0, // Skip the cursor itself if present
			cursor: cursor ? { id: cursor } : undefined,
			orderBy: {
				created_at: "desc",
			},
		});

		let nextCursor: string | undefined = undefined;
		if (notifications.length > limit) {
			notifications.pop(); // Remove the extra item
			const lastItem = notifications[notifications.length - 1];
			nextCursor = lastItem?.id;
		}

		return NextResponse.json({
			data: notifications,
			meta: {
				nextCursor,
			},
		});
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
