import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// Await params
		const { id: caseId } = await params;

		const formData = await req.formData();
		const file = formData.get("file") as File;
		const doc_type_id_param = formData.get("doc_type_id") as string | null;
		const doc_type_name = formData.get("doc_type_name") as string | null;
		const step_id = formData.get("step_id") as string | null;
		const title = formData.get("title") as string | null;

		if (!file) {
			return new NextResponse("Missing file", { status: 400 });
		}
		if (!doc_type_id_param && !doc_type_name) {
			return new NextResponse("Missing doc_type_id or doc_type_name", {
				status: 400,
			});
		}

		// Check Case Existence
		const procurementCase = await prisma.procurement_case.findUnique({
			where: { id: caseId },
		});

		if (!procurementCase) {
			return new NextResponse("Procurement Case not found", {
				status: 404,
			});
		}

		// Resolve Doc Type ID
		let doc_type_id = doc_type_id_param;
		if (!doc_type_id && doc_type_name) {
			let docType = await prisma.master_doc_type.findUnique({
				where: { name: doc_type_name },
			});

			if (!docType) {
				docType = await prisma.master_doc_type.create({
					data: {
						name: doc_type_name,
						is_active: true,
						created_by: session.user.id,
					},
				});
			}
			doc_type_id = docType.id;
		} else if (!doc_type_id) {
			// Should be unreachable due to previous check, but typescript safe
			return new NextResponse("Missing doc_type_id", { status: 400 });
		}

		// Local File Upload Logic
		// Ensure directory: public/uploads/{caseId}
		const uploadDir = path.join(process.cwd(), "public", "uploads", caseId);
		await mkdir(uploadDir, { recursive: true });

		const buffer = Buffer.from(await file.arrayBuffer());
		// Sanitize filename
		const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
		const uniqueName = `${Date.now()}-${safeName}`;
		const filePath = path.join(uploadDir, uniqueName);

		await writeFile(filePath, buffer);

		const fileUrl = `/uploads/${caseId}/${uniqueName}`;

		// Database Transaction
		const result = await prisma.$transaction(async (tx) => {
			// 1. Create Document (Parent)
			// For MVP, simplistic versioning (always v1)
			const document = await tx.document.create({
				data: {
					case_id: caseId,
					doc_type_id: doc_type_id!,
					title: title || file.name,
					step_id: step_id,
					version_no: 1,
					is_latest: true,
					created_by: session.user.id,
				},
			});

			// 2. Create Document File (Child)
			const documentFile = await tx.document_file.create({
				data: {
					document_id: document.id,
					file_name: file.name,
					mime_type: file.type,
					file_size: BigInt(file.size),
					file_url: fileUrl,
					folder_path: filePath, // Store local path as folder_path for reference
					uploaded_by: session.user.id,
					uploaded_at: new Date(),
				},
			});

			return {
				document_id: document.id,
				file: {
					file_name: documentFile.file_name,
					file_url: documentFile.file_url,
				},
			};
		});

		// JSON.stringify can't handle BigInt by default, so we might need a transformer or manual conversion if returned directly.
		// `result` fields are simple types, except file_size which is BigInt but I am not returning the full object, just a safe shape.
		// Wait, `prisma` BigInt is returned as BigInt.
		// But in the return object: { document_id, file: { file_name, file_url } } - these are String.
		// So it should be safe.

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error uploading document:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
