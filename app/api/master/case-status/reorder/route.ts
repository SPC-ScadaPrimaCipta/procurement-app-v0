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
		const { statuses } = body;

		if (!Array.isArray(statuses)) {
			return NextResponse.json(
				{ error: "Invalid data format" },
				{ status: 400 }
			);
		}

		// Update sort_order for each status in a transaction
		await prisma.$transaction(
			statuses.map((status: any) =>
				prisma.case_status.update({
					where: { id: status.id },
					data: { 
						sort_order: status.sort_order,
					},
				})
			)
		);

		return NextResponse.json({ 
			message: "Order updated successfully" 
		});
	} catch (error) {
		console.error("Error updating case status order:", error);
		return NextResponse.json(
			{ error: "Failed to update order" },
			{ status: 500 }
		);
	}
}
