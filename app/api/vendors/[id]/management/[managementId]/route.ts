import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// PUT: Update Vendor Management
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; managementId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: vendorId, managementId } = await params;
		const body = await request.json();

		const { full_name, position_title, phone, email } = body;

		// Validate required fields
		if (!full_name) {
			return NextResponse.json(
				{ error: "Full name is required" },
				{ status: 400 }
			);
		}

		// Check if management exists and belongs to vendor
		const existingManagement = await prisma.vendor_management.findFirst({
			where: {
				id: managementId,
				vendor_id: vendorId,
				is_active: true,
			},
		});

		if (!existingManagement) {
			return NextResponse.json(
				{ error: "Vendor management not found" },
				{ status: 404 }
			);
		}

		// Update vendor management
		const updatedManagement = await prisma.vendor_management.update({
			where: { id: managementId },
			data: {
				full_name,
				position_title: position_title || null,
				phone: phone || null,
				email: email || null,
			},
		});

		return NextResponse.json(updatedManagement);
	} catch (error) {
		console.error("Error updating vendor management:", error);
		return NextResponse.json(
			{ error: "Failed to update vendor management" },
			{ status: 500 }
		);
	}
}

// DELETE: Soft Delete Vendor Management
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string; managementId: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id: vendorId, managementId } = await params;

		// Check if management exists and belongs to vendor
		const existingManagement = await prisma.vendor_management.findFirst({
			where: {
				id: managementId,
				vendor_id: vendorId,
				is_active: true,
			},
		});

		if (!existingManagement) {
			return NextResponse.json(
				{ error: "Vendor management not found" },
				{ status: 404 }
			);
		}

		// Soft delete
		await prisma.vendor_management.update({
			where: { id: managementId },
			data: { is_active: false },
		});

		return NextResponse.json({
			message: "Vendor management deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting vendor management:", error);
		return NextResponse.json(
			{ error: "Failed to delete vendor management" },
			{ status: 500 }
		);
	}
}
