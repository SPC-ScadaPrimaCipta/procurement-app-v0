import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function PATCH(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const json = await request.json();
		const { statusId } = json;

		if (!statusId) {
			return new NextResponse("Status ID is required", { status: 400 });
		}

		// Verify status exists
		const statusExists = await prisma.case_status.findUnique({
			where: { id: statusId },
		});

		if (!statusExists) {
			return new NextResponse("Invalid Status ID", { status: 400 });
		}

		const updatedCase = await prisma.procurement_case.update({
			where: { id },
			data: {
				status_id: statusId,
				updated_at: new Date(),
			},
			include: {
				status: true,
			},
		});

		return NextResponse.json(updatedCase);
	} catch (error) {
		console.error("Error updating case status:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
