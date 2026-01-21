import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import {
	uploadFileToSiteDrive,
	ensureFolderPathOnSiteDrive,
	deleteItemFromSiteDrive,
} from "@/lib/sharepoint";

export const dynamic = "force-dynamic";

// GET: Fetch reimbursement document
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { id: reimbursementId } = await params;

		// Check if reimbursement exists
		const reimbursement = await prisma.reimbursement.findUnique({
			where: { id: reimbursementId },
		});

		if (!reimbursement) {
			return NextResponse.json(
				{ error: "Reimbursement not found" },
				{ status: 404 },
			);
		}

		// Fetch document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "REIMBURSEMENT",
				ref_id: reimbursementId,
			},
			orderBy: {
				uploaded_at: "desc",
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "No document found for this reimbursement" },
				{ status: 404 },
			);
		}

		// Serialize BigInt fields
		const serializedDoc = {
			...document,
			file_size: document.file_size
				? document.file_size.toString()
				: null,
			sp_download_url: document.sp_web_url
				? `${document.sp_web_url}?download=1`
				: null,
		};

		return NextResponse.json({ document: serializedDoc });
	} catch (error) {
		console.error("Error fetching reimbursement document:", error);
		return NextResponse.json(
			{ error: "Failed to fetch document" },
			{ status: 500 },
		);
	}
}

// POST: Upload reimbursement document
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { id: reimbursementId } = await params;

		// Check if reimbursement exists
		const reimbursement = await prisma.reimbursement.findUnique({
			where: { id: reimbursementId },
		});

		if (!reimbursement) {
			return NextResponse.json(
				{ error: "Reimbursement not found" },
				{ status: 404 },
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json(
				{ error: "No file provided" },
				{ status: 400 },
			);
		}

		// Get Microsoft Access Token
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
		});

		if (!account?.accessToken) {
			return NextResponse.json(
				{
					error: "No Microsoft account linked or access token missing.",
				},
				{ status: 400 },
			);
		}

		const accessToken = account.accessToken;
		const siteId = process.env.SP_SITE_ID;

		if (!siteId) {
			return NextResponse.json(
				{
					error: "SharePoint Site ID not configured.",
				},
				{ status: 500 },
			);
		}

		// Get REIMBURSEMENT doc type from master_doc_type
		const reimbursementDocType = await prisma.master_doc_type.findFirst({
			where: {
				name: "REIMBURSEMENT",
			},
		});

		if (!reimbursementDocType) {
			return NextResponse.json(
				{
					error: 'Document type "REIMBURSEMENT" not found in master data.',
				},
				{ status: 500 },
			);
		}

		// Define folder path: Reimbursement/{reimbursement_no}
		const folderPath = `Reimbursement/${reimbursement.reimbursement_no || reimbursementId}`;

		// Ensure folder structure exists
		await ensureFolderPathOnSiteDrive({
			siteId,
			accessToken,
			folderPath,
		});

		// Delete existing document if any (single file per reimbursement)
		const existingDoc = await prisma.document.findFirst({
			where: {
				ref_type: "REIMBURSEMENT",
				ref_id: reimbursementId,
			},
		});

		if (existingDoc) {
			// Delete from SharePoint first
			if (existingDoc.sp_item_id) {
				try {
					await deleteItemFromSiteDrive({
						siteId,
						accessToken,
						itemId: existingDoc.sp_item_id,
					});
				} catch (error) {
					console.error(
						"Error deleting old file from SharePoint:",
						error,
					);
				}
			}

			// Delete from database
			await prisma.document.delete({
				where: { id: existingDoc.id },
			});
		}

		// Upload new file to SharePoint
		const uploadResult = await uploadFileToSiteDrive({
			siteId,
			accessToken,
			folderPath,
			file,
		});

		// Save document metadata to database
		const newDocument = await prisma.document.create({
			data: {
				ref_type: "REIMBURSEMENT",
				ref_id: reimbursementId,
				doc_type_id: reimbursementDocType.id,
				title: `Reimbursement Scan - ${reimbursement.reimbursement_no}`,
				version_no: 1,
				is_latest: true,
				file_url: uploadResult.webUrl,
				file_name: file.name,
				mime_type: file.type,
				file_size: BigInt(file.size),
				sp_site_id: uploadResult.siteId,
				sp_drive_id: uploadResult.driveId,
				sp_item_id: uploadResult.itemId,
				sp_web_url: uploadResult.webUrl,
				folder_path: folderPath,
				uploaded_by: session.user.id,
			},
		});

		// Serialize BigInt
		const serializedDoc = {
			...newDocument,
			file_size: newDocument.file_size
				? newDocument.file_size.toString()
				: null,
		};

		return NextResponse.json(
			{
				message: "Reimbursement document uploaded successfully",
				document: serializedDoc,
			},
			{ status: 201 },
		);
	} catch (error) {
		console.error("Error uploading reimbursement document:", error);
		return NextResponse.json(
			{ error: "Failed to upload document" },
			{ status: 500 },
		);
	}
}

// DELETE: Delete reimbursement document
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const { id: reimbursementId } = await params;

		// Check if reimbursement exists
		const reimbursement = await prisma.reimbursement.findUnique({
			where: { id: reimbursementId },
		});

		if (!reimbursement) {
			return NextResponse.json(
				{ error: "Reimbursement not found" },
				{ status: 404 },
			);
		}

		// Find document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "REIMBURSEMENT",
				ref_id: reimbursementId,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "No document found for this reimbursement" },
				{ status: 404 },
			);
		}

		// Get Microsoft Access Token
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
		});

		// Get Site ID
		const siteId = process.env.SP_SITE_ID;

		if (account?.accessToken && document.sp_item_id && siteId) {
			try {
				await deleteItemFromSiteDrive({
					siteId,
					accessToken: account.accessToken,
					itemId: document.sp_item_id,
				});
			} catch (error) {
				console.error("Error deleting file from SharePoint:", error);
			}
		}

		// Delete from database
		await prisma.document.delete({
			where: { id: document.id },
		});

		return NextResponse.json({
			message: "Reimbursement document deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting reimbursement document:", error);
		return NextResponse.json(
			{ error: "Failed to delete document" },
			{ status: 500 },
		);
	}
}
