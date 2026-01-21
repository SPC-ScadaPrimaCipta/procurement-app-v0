import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteItemFromSiteDrive } from "@/lib/sharepoint";

// GET /api/vendors/[id] - Get vendor by ID
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

		const { id } = await params;

		const vendor = await prisma.vendor.findUnique({
			where: { id },
			include: {
				supplier_type: true,
				vendor_bank_account: {
					orderBy: {
						is_primary: 'desc',
					},
				},
				_count: {
					select: {
						contract: true,
						vendor_bank_account: true,
						vendor_business_license: true,
						vendor_management: true,
					},
				},
			},
		});

		if (!vendor) {
			return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
		}

		// Transform vendor_bank_account to match frontend interface
		const transformedVendor = {
			...vendor,
			supplier_type: vendor.supplier_type?.name || "Unknown",
			vendor_account: vendor.vendor_bank_account.map((acc) => ({
				id: acc.id,
				account_number: acc.account_number,
				bank: acc.bank_name || "N/A",
				branch: acc.branch_name || "N/A",
				is_primary: acc.is_primary,
			})),
		};

		return NextResponse.json(transformedVendor);
	} catch (error) {
		console.error("Error fetching vendor:", error);
		return NextResponse.json(
			{ error: "Failed to fetch vendor" },
			{ status: 500 }
		);
	}
}

// PUT /api/vendors/[id] - Update vendor
export async function PUT(
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

		const { id } = await params;
		const body = await request.json();
		const { vendor_name, supplier_type_id, npwp, address, is_active } = body;

		// Check if vendor exists
		const existingVendor = await prisma.vendor.findUnique({
			where: { id },
		});

		if (!existingVendor) {
			return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
		}

		// Check if NPWP already exists (if changed)
		if (npwp && npwp !== existingVendor.npwp) {
			const duplicateVendor = await prisma.vendor.findFirst({
				where: {
					npwp,
					id: { not: id },
				},
			});

			if (duplicateVendor) {
				return NextResponse.json(
					{ error: "NPWP already exists" },
					{ status: 400 }
				);
			}
		}

		const vendor = await prisma.vendor.update({
			where: { id },
			data: {
				vendor_name: vendor_name || existingVendor.vendor_name,
				supplier_type_id: supplier_type_id || existingVendor.supplier_type_id,
				npwp: npwp !== undefined ? npwp : existingVendor.npwp,
				address: address !== undefined ? address : existingVendor.address,
				is_active: is_active !== undefined ? is_active : existingVendor.is_active,
				updated_at: new Date(),
			},
			include: {
				supplier_type: true,
			},
		});

		return NextResponse.json(vendor);
	} catch (error) {
		console.error("Error updating vendor:", error);
		return NextResponse.json(
			{ error: "Failed to update vendor" },
			{ status: 500 }
		);
	}
}

// DELETE /api/vendors/[id] - Delete vendor
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

		const { id } = await params;

		// Check if vendor exists
		const existingVendor = await prisma.vendor.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						contract: true,
					},
				},
			},
		});

		if (!existingVendor) {
			return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
		}

		// Check if vendor has contracts (prevent deletion)
		if (existingVendor._count.contract > 0) {
			return NextResponse.json(
				{
					error: `Cannot delete vendor with ${existingVendor._count.contract} existing contract(s). Please deactivate instead.`,
				},
				{ status: 400 }
			);
		}

		// Get NPWP document if exists
		const vendorDocType = await prisma.master_doc_type.findFirst({
			where: {
				name: "VENDOR",
				is_active: true,
			},
		});

		if (vendorDocType) {
			const npwpDocument = await prisma.document.findFirst({
				where: {
					ref_type: "VENDOR_NPWP",
					ref_id: id,
					doc_type_id: vendorDocType.id,
				},
			});

			// Delete from SharePoint if exists
			if (npwpDocument?.sp_item_id) {
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
							itemId: npwpDocument.sp_item_id,
						});
						console.log(`Deleted NPWP file from SharePoint: ${npwpDocument.file_name}`);
					} catch (error) {
						console.error("Failed to delete NPWP file from SharePoint:", error);
						// Continue anyway
					}
				}
			}

			// Delete NPWP document record from database
			if (npwpDocument) {
				await prisma.document.delete({
					where: { id: npwpDocument.id },
				});
			}
		}

		// Soft delete by setting is_active to false
		await prisma.vendor.update({
			where: { id },
			data: {
				is_active: false,
				updated_at: new Date(),
			},
		});

		return NextResponse.json({ message: "Vendor deleted successfully" });
	} catch (error) {
		console.error("Error deleting vendor:", error);
		return NextResponse.json(
			{ error: "Failed to delete vendor" },
			{ status: 500 }
		);
	}
}
