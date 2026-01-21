import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// 1. Get current case and its status
		const currentCase = await prisma.procurement_case.findUnique({
			where: { id },
			include: { status: true },
		});

		if (!currentCase || !currentCase.status) {
			return new NextResponse("Case or case status not found", {
				status: 404,
			});
		}

		// 2. Find next status (sort_order + 1)
		let nextStatus = await prisma.case_status.findFirst({
			where: {
				sort_order: currentCase.status.sort_order + 1,
				is_active: true,
			},
		});

		// Fallback: If no next step defined by sort_order, check if we should move to "DONE"
		if (!nextStatus) {
			nextStatus = await prisma.case_status.findUnique({
				where: { name: "DONE" },
			});
		}

		if (!nextStatus) {
			return new NextResponse("Next status not found", {
				status: 400,
			});
		}

		// 3. Update the procurement case status
		const updatedCase = await prisma.procurement_case.update({
			where: {
				id: id,
			},
			data: {
				status_id: nextStatus.id,
				updated_at: new Date(),
			},
		});

		return NextResponse.json(updatedCase);
	} catch (error) {
		console.error("Error forwarding procurement case:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
