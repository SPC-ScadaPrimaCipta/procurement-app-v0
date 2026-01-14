import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE: Delete reimbursement file
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; fileId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: reimbursementId, fileId } = await params;

		// Check if file exists and belongs to this reimbursement
		const file = await prisma.reimbursement_file.findUnique({
			where: { id: fileId },
		});

		if (!file || file.reimbursement_id !== reimbursementId) {
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}

		// Delete file from database
		await prisma.reimbursement_file.delete({
			where: { id: fileId },
		});

		// TODO: Optionally delete physical file from disk
		// const fs = require("fs");
		// const filePath = path.join(process.cwd(), "public", file.file_url);
		// if (fs.existsSync(filePath)) {
		//   fs.unlinkSync(filePath);
		// }

		return NextResponse.json({ message: "File deleted successfully" });
	} catch (error) {
		console.error("Error deleting file:", error);
		return NextResponse.json(
			{ error: "Failed to delete file" },
			{ status: 500 }
		);
	}
}
