import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
	req: Request,
	props: { params: Promise<{ id: string }> },
) {
	const params = await props.params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userRoles = (session.user as any).roles || [];
	const notificationId = params.id;

	try {
		// First fetch to check permission
		const notification = await prisma.notification.findUnique({
			where: { id: notificationId },
		});

		if (!notification) {
			return new NextResponse("Not Found", { status: 404 });
		}

		// Validate ownership
		let canEdit = false;
		if (
			notification.recipient_type === "USER" &&
			notification.recipient_id === session.user.id
		) {
			canEdit = true;
		} else if (
			notification.recipient_type === "ROLE" &&
			userRoles.includes(notification.recipient_id)
		) {
			canEdit = true;
		}

		if (!canEdit) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const updated = await prisma.notification.update({
			where: { id: notificationId },
			data: {
				read_at: new Date(),
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
