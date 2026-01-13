import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { writeFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

// POST: Upload file for regulation
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: regulationId } = await params;

		// Check if regulation exists
		const regulation = await prisma.regulation_document.findUnique({
			where: { id: regulationId },
		});

		if (!regulation) {
			return NextResponse.json(
				{ error: "Regulation not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Generate unique filename
		const timestamp = Date.now();
		const originalName = file.name;
		const extension = path.extname(originalName);
		const baseName = path.basename(originalName, extension);
		const uniqueFileName = `${baseName}_${timestamp}${extension}`;

		// Save file to public/uploads/peraturan
		const uploadDir = path.join(process.cwd(), "public", "uploads", "peraturan");
		const filePath = path.join(uploadDir, uniqueFileName);

		// Create directory if not exists
		const fs = require("fs");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Write file
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		await writeFile(filePath, buffer);

		// Save file record to database
		const fileUrl = `/uploads/peraturan/${uniqueFileName}`;
		const regulationFile = await prisma.regulation_file.create({
			data: {
				regulation_document_id: regulationId,
				file_name: originalName,
				mime_type: file.type,
				file_size: BigInt(file.size),
				file_url: fileUrl,
				uploaded_by: session.user.id,
			},
		});

		return NextResponse.json(regulationFile, { status: 201 });
	} catch (error) {
		console.error("Error uploading file:", error);
		return NextResponse.json(
			{ error: "Failed to upload file" },
			{ status: 500 }
		);
	}
}
