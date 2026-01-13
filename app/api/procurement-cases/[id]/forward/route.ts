import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// Find the "WAITING PPK" status
		const status = await prisma.case_status.findFirst({
			where: {
				name: "WAITING PPK",
			},
		});

		if (!status) {
			return new NextResponse("Status 'WAITING PPK' not found", {
				status: 404,
			});
		}

		// Update the procurement case status
		const updatedCase = await prisma.procurement_case.update({
			where: {
				id: id,
			},
			data: {
				status_id: status.id,
				updated_at: new Date(),
			},
		});

		return NextResponse.json(updatedCase);
	} catch (error) {
		console.error("Error forwarding procurement case:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
