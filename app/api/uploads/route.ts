import { NextRequest, NextResponse } from "next/server";
import {
	uploadFileToSiteDrive,
	ensureFolderPathOnSiteDrive,
} from "@/lib/sharepoint";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		// 1. Authenticate
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// 2. Get Microsoft Access Token
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
		});

		// Note: If no Microsoft account is linked, we can't upload to SharePoint
		if (!account?.accessToken) {
			return NextResponse.json(
				{
					error: "No Microsoft account linked or access token missing.",
				},
				{ status: 400 }
			);
		}

		const accessToken = account.accessToken;
		const siteId = process.env.SP_SITE_ID;

		if (!siteId) {
			return NextResponse.json(
				{
					error: "SharePoint Site ID (SHAREPOINT_SITE_ID) not configured.",
				},
				{ status: 500 }
			);
		}

		// 3. Parse Form Data
		const formData = await request.formData();
		const files = formData.getAll("files") as File[];
		const singleFile = formData.get("file") as File | null;

		const allFiles = [...files];
		if (singleFile) {
			allFiles.push(singleFile);
		}

		if (allFiles.length === 0) {
			return NextResponse.json(
				{ error: "No files received." },
				{ status: 400 }
			);
		}

		// Optional Metadata for DB mapping
		const refType = formData.get("ref_type") as string; // e.g. "procurement_case"
		const refId = formData.get("ref_id") as string; // UUID
		const docTypeId = formData.get("doc_type_id") as string; // UUID
		const stepIdRaw = formData.get("step_id");
		const stepId =
			typeof stepIdRaw === "string" && stepIdRaw.trim()
				? stepIdRaw
				: null;
		const folderPathInput = formData.get("folder_path") as string;

		// Default folder path if not provided
		const targetFolderPath = folderPathInput || "General/Uploads";

		const uploadedResults = [];

		// 4. Ensure Folder Exists (once)
		try {
			await ensureFolderPathOnSiteDrive({
				siteId,
				accessToken,
				folderPath: targetFolderPath,
			});
		} catch (error: any) {
			console.error("Failed to ensure folder path:", error);
			return NextResponse.json(
				{ error: `Failed to create folder: ${error.message}` },
				{ status: 502 }
			);
		}

		// 5. Upload Files and Create DB Records
		for (const file of allFiles) {
			try {
				// Upload to SharePoint
				const spFile = await uploadFileToSiteDrive({
					siteId,
					accessToken,
					folderPath: targetFolderPath,
					file,
				});

				let documentRecord = null;

				// If we have enough context, create a document record in Postgres
				if (refType && refId && docTypeId) {
					documentRecord = await prisma.document.create({
						data: {
							ref_type: refType,
							ref_id: refId,
							doc_type_id: docTypeId,
							step_id: stepId || null,

							title: file.name,
							doc_date: new Date(),
							version_no: 1,
							is_latest: true,

							file_name: spFile.name,
							mime_type: file.type,
							file_size: spFile.size,
							file_url: spFile.webUrl, // Using SharePoint WebURL

							// Leaving these empty as requested for now
							// sp_site_id: siteId,
							// sp_drive_id: ...,
							// sp_item_id: spFile.id,
							folder_path: targetFolderPath,

							uploaded_by: session.user.id,
						},
					});
				}

				uploadedResults.push({
					name: spFile.name,
					url: spFile.webUrl,
					size: spFile.size,
					id: spFile.id, // SharePoint ID
					dbId: documentRecord?.id, // Database ID if created
				});
			} catch (error: any) {
				console.error(`Error uploading file ${file.name}:`, error);
				uploadedResults.push({
					name: file.name,
					error: error.message || "Upload failed",
				});
			}
		}

		return NextResponse.json(uploadedResults);
	} catch (error) {
		console.error("Upload API Error:", error);
		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
