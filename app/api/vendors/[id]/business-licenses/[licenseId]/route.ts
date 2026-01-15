import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { deleteItemFromSiteDrive } from "@/lib/sharepoint";

export const dynamic = "force-dynamic";

// PUT: Update Business License
export async function PUT(
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
		const body = await request.json();

		const { license_type, license_number, qualification, issued_date, expiry_date } = body;

		// Validate required fields
		if (!license_type || !license_number) {
			return NextResponse.json(
				{ error: "License type and license number are required" },
				{ status: 400 }
			);
		}

		// Check if license exists and belongs to vendor
		const existingLicense = await prisma.vendor_business_license.findFirst({
			where: {
				id: licenseId,
				vendor_id: vendorId,
			},
		});

		if (!existingLicense) {
			return NextResponse.json(
				{ error: "Business license not found" },
				{ status: 404 }
			);
		}

		// Check for duplicate license number (excluding current license)
		if (license_number !== existingLicense.license_number) {
			const duplicateLicense = await prisma.vendor_business_license.findFirst({
				where: {
					vendor_id: vendorId,
					license_number,
					id: { not: licenseId },
				},
			});

			if (duplicateLicense) {
				return NextResponse.json(
					{ error: "License number already exists for this vendor" },
					{ status: 400 }
				);
			}
		}

		// Update business license
		const updatedLicense = await prisma.vendor_business_license.update({
			where: { id: licenseId },
			data: {
				license_type,
				license_number,
				qualification: qualification || "",
				issued_date: issued_date ? new Date(issued_date) : null,
				expiry_date: expiry_date ? new Date(expiry_date) : null,
			},
		});

		return NextResponse.json(updatedLicense);
	} catch (error) {
		console.error("Error updating business license:", error);
		return NextResponse.json(
			{ error: "Failed to update business license" },
			{ status: 500 }
		);
	}
}

// DELETE: Soft Delete Business License
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

		// Check if license exists and belongs to vendor
		const existingLicense = await prisma.vendor_business_license.findFirst({
			where: {
				id: licenseId,
				vendor_id: vendorId,
			},
		});

		if (!existingLicense) {
			return NextResponse.json(
				{ error: "Business license not found" },
				{ status: 404 }
			);
		}

		// Delete associated documents from SharePoint and database
		const documents = await prisma.document.findMany({
			where: {
				ref_type: "VENDOR_BUSINESS_LICENSE",
				ref_id: licenseId,
			},
		});

		if (documents.length > 0) {
			// Get Microsoft Access Token from database
			const account = await prisma.account.findFirst({
				where: {
					userId: session.user.id,
					providerId: "microsoft",
				},
			});

			if (!account?.accessToken) {
				console.error(
					"No Microsoft account linked or access token missing for SharePoint operations"
				);
			} else {
				const accessToken = account.accessToken;
				// Delete files from SharePoint
				for (const doc of documents) {
					if (doc.sp_item_id) {
						try {
							await deleteItemFromSiteDrive(accessToken, doc.sp_item_id);
							console.log(
								`Deleted business license document from SharePoint: ${doc.file_name}`
							);
						} catch (error) {
							console.error(
								`Error deleting file from SharePoint: ${doc.file_name}`,
								error
							);
						}
					}
				}
			}

			// Delete document records from database
			await prisma.document.deleteMany({
				where: {
					ref_type: "VENDOR_BUSINESS_LICENSE",
					ref_id: licenseId,
				},
			});
		}

		// Delete permanently
		await prisma.vendor_business_license.delete({
			where: { id: licenseId },
		});

		return NextResponse.json({ message: "Business license deleted successfully" });
	} catch (error) {
		console.error("Error deleting business license:", error);
		return NextResponse.json(
			{ error: "Failed to delete business license" },
			{ status: 500 }
		);
	}
}
