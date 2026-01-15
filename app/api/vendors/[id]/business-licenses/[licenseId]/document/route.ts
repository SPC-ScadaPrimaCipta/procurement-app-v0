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

// GET: Fetch business license document
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; licenseId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: vendorId, licenseId } = await params;

		// Check if license exists and belongs to this vendor
		const license = await prisma.vendor_business_license.findFirst({
			where: {
				id: licenseId,
				vendor_id: vendorId,
			},
		});

		if (!license) {
			return NextResponse.json(
				{ error: "Business license not found" },
				{ status: 404 }
			);
		}

		// Fetch document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_BUSINESS_LICENSE",
				ref_id: licenseId,
			},
			orderBy: {
				uploaded_at: "desc",
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "No document found for this business license" },
				{ status: 404 }
			);
		}

		// Serialize BigInt fields
		const serializedDoc = {
			...document,
			file_size: document.file_size ? document.file_size.toString() : null,
			sp_download_url: document.sp_web_url
				? `${document.sp_web_url}?download=1`
				: null,
		};

		return NextResponse.json({ document: serializedDoc });
	} catch (error) {
		console.error("Error fetching business license document:", error);
		return NextResponse.json(
			{ error: "Failed to fetch document" },
			{ status: 500 }
		);
	}
}

// POST: Upload business license document
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; licenseId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: vendorId, licenseId } = await params;

		// Check if license exists and belongs to this vendor
		const license = await prisma.vendor_business_license.findFirst({
			where: {
				id: licenseId,
				vendor_id: vendorId,
			},
			include: {
				vendor: true,
			},
		});

		if (!license) {
			return NextResponse.json(
				{ error: "Business license not found" },
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
			},
		});

		if (!vendorDocType) {
			return NextResponse.json(
				{
					error: 'Document type "VENDOR" not found in master data.',
				},
				{ status: 500 }
			);
		}

		// Define folder path: Vendor/{vendor_name}/Licenses/{license_number}
		const folderPath = `Vendor/${license.vendor.vendor_name}/Licenses/${license.license_number}`;

		// Ensure folder structure exists
		await ensureFolderPathOnSiteDrive({
			siteId,
			accessToken,
			folderPath,
		});

		// Delete existing document if any (single file per license)
		const existingDoc = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_BUSINESS_LICENSE",
				ref_id: licenseId,
			},
		});

		if (existingDoc) {
			// Delete from SharePoint first
			if (existingDoc.sp_item_id) {
				try {
					await deleteItemFromSiteDrive(accessToken, existingDoc.sp_item_id);
				} catch (error) {
					console.error("Error deleting old file from SharePoint:", error);
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
				ref_type: "VENDOR_BUSINESS_LICENSE",
				ref_id: licenseId,
				doc_type_id: vendorDocType.id,
				title: `Business License - ${license.license_type}`,
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
				message: "Business license document uploaded successfully",
				document: serializedDoc,
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error uploading business license document:", error);
		return NextResponse.json(
			{ error: "Failed to upload document" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete business license document
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; licenseId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: vendorId, licenseId } = await params;

		// Check if license exists and belongs to this vendor
		const license = await prisma.vendor_business_license.findFirst({
			where: {
				id: licenseId,
				vendor_id: vendorId,
			},
		});

		if (!license) {
			return NextResponse.json(
				{ error: "Business license not found" },
				{ status: 404 }
			);
		}

		// Find document
		const document = await prisma.document.findFirst({
			where: {
				ref_type: "VENDOR_BUSINESS_LICENSE",
				ref_id: licenseId,
			},
		});

		if (!document) {
			return NextResponse.json(
				{ error: "No document found for this business license" },
				{ status: 404 }
			);
		}

		// Get Microsoft Access Token
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
		});

		if (account?.accessToken && document.sp_item_id) {
			try {
				await deleteItemFromSiteDrive(account.accessToken, document.sp_item_id);
			} catch (error) {
				console.error("Error deleting file from SharePoint:", error);
			}
		}

		// Delete from database
		await prisma.document.delete({
			where: { id: document.id },
		});

		return NextResponse.json({
			message: "Business license document deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting business license document:", error);
		return NextResponse.json(
			{ error: "Failed to delete document" },
			{ status: 500 }
		);
	}
}
