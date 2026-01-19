import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function PUT(request: Request) {
	try {
		const canManage = await hasPermission("manage", "masterData");
		if (!canManage) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { recipients } = body;

		if (!Array.isArray(recipients)) {
			return NextResponse.json(
				{ error: "Invalid data format" },
				{ status: 400 }
			);
		}

		// Update sort_order for each recipient in a transaction
		await prisma.$transaction(
			recipients.map((recipient: any) =>
				prisma.master_disposition_recipient.update({
					where: { id: recipient.id },
					data: { 
						sort_order: recipient.sort_order,
						updated_at: new Date(),
					},
				})
			)
		);

		return NextResponse.json({ 
			message: "Order updated successfully" 
		});
	} catch (error) {
		console.error("Error updating disposition recipient order:", error);
		return NextResponse.json(
			{ error: "Failed to update order" },
			{ status: 500 }
		);
	}
}
