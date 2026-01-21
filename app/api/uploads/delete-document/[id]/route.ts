import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function DELETE(
	request: NextRequest,
	context: { params: Promise<{ id: string }> },
) {
	const { id: documentId } = await context.params;

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		if (!documentId) {
			return NextResponse.json(
				{ error: "documentId is required in URL" },
				{ status: 400 },
			);
		}

		const existingDoc = await prisma.document.findUnique({
			where: { id: documentId },
		});

		if (!existingDoc) {
			return NextResponse.json(
				{ error: "Document not found" },
				{ status: 404 },
			);
		}

		const updated = await prisma.document.update({
			where: { id: documentId },
			data: {
				is_active: false,
				deleted_at: new Date(),
				deleted_by: session.user.id,
				is_latest: false,
			},
		});

		return NextResponse.json({
			success: true,
			documentId,
			message: "Document deleted",
		});
	} catch (error) {
		console.error("Delete API Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 },
		);
	}
}
