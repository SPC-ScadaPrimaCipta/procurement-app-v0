import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST: Create Business License
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
		const body = await request.json();

		const { license_type, license_number, qualification, issued_date, expiry_date } = body;

		// Validate required fields
		if (!license_type || !license_number) {
			return NextResponse.json(
				{ error: "License type and license number are required" },
				{ status: 400 }
			);
		}

		// Check if vendor exists
		const vendor = await prisma.vendor.findUnique({
			where: { id: vendorId, is_active: true },
		});

		if (!vendor) {
			return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
		}

		// Check for duplicate license number for this vendor
		const existingLicense = await prisma.vendor_business_license.findFirst({
			where: {
				vendor_id: vendorId,
				license_number,
			},
		});

		if (existingLicense) {
			return NextResponse.json(
				{ error: "License number already exists for this vendor" },
				{ status: 400 }
			);
		}

		// Create business license
		const businessLicense = await prisma.vendor_business_license.create({
			data: {
				vendor_id: vendorId,
				license_type,
				license_number,
				qualification: qualification || "",
				issued_date: issued_date ? new Date(issued_date) : null,
				expiry_date: expiry_date ? new Date(expiry_date) : null,
				created_by: session.user.id,
			},
		});

		return NextResponse.json(businessLicense, { status: 201 });
	} catch (error) {
		console.error("Error creating business license:", error);
		return NextResponse.json(
			{ error: "Failed to create business license" },
			{ status: 500 }
		);
	}
}
