import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// POST: Create Vendor Management
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

		const { full_name, position_title, phone, email } = body;

		// Validate required fields
		if (!full_name) {
			return NextResponse.json(
				{ error: "Full name is required" },
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

		// Create vendor management
		const management = await prisma.vendor_management.create({
			data: {
				vendor_id: vendorId,
				full_name,
				position_title: position_title || null,
				phone: phone || null,
				email: email || null,
				is_active: true,
				created_by: session.user.id,
			},
		});

		return NextResponse.json(management, { status: 201 });
	} catch (error) {
		console.error("Error creating vendor management:", error);
		return NextResponse.json(
			{ error: "Failed to create vendor management" },
			{ status: 500 }
		);
	}
}
