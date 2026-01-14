import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const canCreate = await hasPermission("manage", "kontrak"); // Assuming separate permission or same as contract
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const { id } = await params;
		const body = await req.json(); // Expecting array of payment plans or object

		// Validiting body is array
		if (!Array.isArray(body)) {
			return new NextResponse("Invalid body, expected array", {
				status: 400,
			});
		}

		await prisma.$transaction(async (tx) => {
			// Optional: Delete existing plans if we want to treat this as "set plans"
			// await tx.contract_payment_plan.deleteMany({ where: { contract_id: id } });

			for (const item of body) {
				await tx.contract_payment_plan.create({
					data: {
						contract_id: id,
						payment_method: item.payment_method,
						line_no: item.line_no,
						line_amount: item.amount,
						// planned_date: item.planned_date ? new Date(item.planned_date) : null, // If we had date
						// notes: item.notes
					},
				});
			}
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error creating payment plan:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
