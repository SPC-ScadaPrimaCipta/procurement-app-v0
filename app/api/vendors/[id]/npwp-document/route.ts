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

// GET: Fetch NPWP document for vendor
export async function GET(
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

		const { id: vendorId } = await params;

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

		// Fetch NPWP document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_NPWP",
				ref_id: vendorId,
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
		console.error("Error fetching NPWP document:", error);
		return NextResponse.json(
			{ error: "Failed to fetch NPWP document" },
			{ status: 500 }
		);
	}
}

// POST: Upload NPWP document for vendor
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

		const { id: vendorId } = await params;

		// Check if vendor exists
		const vendor = await prisma.vendor.findUnique({
			where: { id: vendorId },
		});

		if (!vendor) {
			return NextResponse.json(
				{ error: "Vendor not found" },
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
				ref_type: "VENDOR_NPWP",
				ref_id: vendorId,
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

		// Upload file to SharePoint with structure: Vendor/[vendor_name]/NPWP/
		const folderPath = `Vendor/${vendor.vendor_name}/NPWP`;

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
					ref_type: "VENDOR_NPWP",
					ref_id: vendorId,
					doc_type_id: vendorDocType.id,
					title: `NPWP - ${vendor.vendor_name}`,
					doc_number: vendor.npwp,
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
				message: "NPWP document uploaded successfully",
				document: documentData,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error uploading NPWP document:", error);
		return NextResponse.json(
			{ error: "Failed to upload NPWP document" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete NPWP document
export async function DELETE(
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

		const { id: vendorId } = await params;

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
				ref_type: "VENDOR_NPWP",
				ref_id: vendorId,
				doc_type_id: vendorDocType.id,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "NPWP document not found" },
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
			message: "NPWP document deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting NPWP document:", error);
		return NextResponse.json(
			{ error: "Failed to delete NPWP document" },
			{ status: 500 }
		);
	}
}
