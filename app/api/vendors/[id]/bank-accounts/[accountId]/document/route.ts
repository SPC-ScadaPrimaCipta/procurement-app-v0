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

// GET: Fetch bank account document
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; accountId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { accountId } = await params;

		// Get VENDOR doc type
		const vendorDocType = await prisma.master_doc_type.findFirst({
			where: {
				name: "VENDOR",
				is_active: true,
			},
		});

		if (!vendorDocType) {
			return NextResponse.json(
				{ error: "VENDOR document type not found in master data" },
				{ status: 404 }
			);
		}

		// Fetch bank account document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_BANK_ACCOUNT",
				ref_id: accountId,
				doc_type_id: vendorDocType.id,
			},
			include: {
				master_doc_type: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				uploaded_at: "desc",
			},
		});

		if (!document) {
			return NextResponse.json({ document: null });
		}

		// Convert BigInt to string for JSON serialization
		const documentData = {
			...document,
			file_size: document.file_size ? document.file_size.toString() : null,
		};

		return NextResponse.json({ document: documentData });
	} catch (error) {
		console.error("Error fetching bank account document:", error);
		return NextResponse.json(
			{ error: "Failed to fetch bank account document" },
			{ status: 500 }
		);
	}
}

// POST: Upload bank account document
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; accountId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: vendorId, accountId } = await params;

		// Check if vendor and bank account exist
		const vendor = await prisma.vendor.findUnique({
			where: { id: vendorId },
		});

		if (!vendor) {
			return NextResponse.json(
				{ error: "Vendor not found" },
				{ status: 404 }
			);
		}

		const bankAccount = await prisma.vendor_bank_account.findUnique({
			where: { id: accountId },
		});

		if (!bankAccount) {
			return NextResponse.json(
				{ error: "Bank account not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
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
				{ status: 400 }
			);
		}

		const accessToken = account.accessToken;
		const siteId = process.env.SP_SITE_ID;

		if (!siteId) {
			return NextResponse.json(
				{
					error: "SharePoint Site ID not configured.",
				},
				{ status: 500 }
			);
		}

		// Get VENDOR doc type from master_doc_type
		const vendorDocType = await prisma.master_doc_type.findFirst({
			where: {
				name: "VENDOR",
				is_active: true,
			},
		});

		if (!vendorDocType) {
			return NextResponse.json(
				{ error: "VENDOR document type not found in master data" },
				{ status: 404 }
			);
		}

		// Check if document already exists (single file only)
		const existingDocument = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_BANK_ACCOUNT",
				ref_id: accountId,
				doc_type_id: vendorDocType.id,
			},
		});

		// If exists, delete from SharePoint first
		if (existingDocument?.sp_item_id) {
			try {
				await deleteItemFromSiteDrive({
					siteId,
					accessToken,
					itemId: existingDocument.sp_item_id,
				});
			} catch (error) {
				console.error("Failed to delete existing file from SharePoint:", error);
				// Continue anyway
			}
		}

		// Upload file to SharePoint with structure: Vendor/[vendor_name]/Bank/[account_number]/
		const folderPath = `Vendor/${vendor.vendor_name}/Bank/${bankAccount.account_number}`;

		// Ensure folder exists
		try {
			await ensureFolderPathOnSiteDrive({
				siteId,
				accessToken,
				folderPath,
			});
		} catch (error: any) {
			console.error("Failed to ensure folder path:", error);
			return NextResponse.json(
				{ error: `Failed to create folder: ${error.message}` },
				{ status: 502 }
			);
		}

		// Upload to SharePoint
		const spFile = await uploadFileToSiteDrive({
			siteId,
			accessToken,
			folderPath,
			file,
		});

		// Save or update document record to database
		let document;
		if (existingDocument) {
			// Update existing record
			document = await prisma.document.update({
				where: { id: existingDocument.id },
				data: {
					file_name: spFile.name,
					mime_type: file.type,
					file_size: BigInt(spFile.size),
					file_url: spFile.webUrl,
					folder_path: folderPath,
					sp_item_id: spFile.id,
					uploaded_by: session.user.id,
					uploaded_at: new Date(),
					updated_at: new Date(),
				},
			});
		} else {
			// Create new record
			document = await prisma.document.create({
				data: {
					ref_type: "VENDOR_BANK_ACCOUNT",
					ref_id: accountId,
					doc_type_id: vendorDocType.id,
					title: `Rekening Koran - ${bankAccount.bank_name} ${bankAccount.account_number}`,
					doc_number: bankAccount.account_number,
					doc_date: new Date(),
					step_id: null,
					version_no: 1,
					is_latest: true,
					file_name: spFile.name,
					mime_type: file.type,
					file_size: BigInt(spFile.size),
					file_url: spFile.webUrl,
					folder_path: folderPath,
					sp_item_id: spFile.id,
					uploaded_by: session.user.id,
				},
			});
		}

		// Convert BigInt to string for JSON serialization
		const documentData = {
			...document,
			file_size: document.file_size ? document.file_size.toString() : null,
		};

		return NextResponse.json(
			{
				message: "Bank account document uploaded successfully",
				document: documentData,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error uploading bank account document:", error);
		return NextResponse.json(
			{ error: "Failed to upload bank account document" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete bank account document
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; accountId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { accountId } = await params;

		// Get VENDOR doc type
		const vendorDocType = await prisma.master_doc_type.findFirst({
			where: {
				name: "VENDOR",
				is_active: true,
			},
		});

		if (!vendorDocType) {
			return NextResponse.json(
				{ error: "VENDOR document type not found in master data" },
				{ status: 404 }
			);
		}

		// Find document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_BANK_ACCOUNT",
				ref_id: accountId,
				doc_type_id: vendorDocType.id,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "Bank account document not found" },
				{ status: 404 }
			);
		}

		// Delete from SharePoint if sp_item_id exists
		if (document.sp_item_id) {
			const account = await prisma.account.findFirst({
				where: {
					userId: session.user.id,
					providerId: "microsoft",
				},
			});

			const siteId = process.env.SP_SITE_ID;

			if (account?.accessToken && siteId) {
				try {
					await deleteItemFromSiteDrive({
						siteId,
						accessToken: account.accessToken,
						itemId: document.sp_item_id,
					});
				} catch (error) {
					console.error("Failed to delete file from SharePoint:", error);
					// Continue to delete from database anyway
				}
			}
		}

		// Delete from database
		await prisma.document.delete({
			where: { id: document.id },
		});

		return NextResponse.json({
			message: "Bank account document deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting bank account document:", error);
		return NextResponse.json(
			{ error: "Failed to delete bank account document" },
			{ status: 500 }
		);
	}
}
