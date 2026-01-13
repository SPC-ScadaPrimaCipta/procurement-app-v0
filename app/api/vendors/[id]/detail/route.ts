import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/vendors/[id]/detail - Get vendor with all child data
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
				supplier_type: {
					select: {
						name: true,
					},
				},
				vendor_bank_account: {
					where: {
						is_active: true,
					},
					orderBy: {
						is_primary: "desc",
					},
					select: {
						id: true,
						account_number: true,
						account_name: true,
						bank_name: true,
						branch_name: true,
						currency_code: true,
						is_primary: true,
					},
				},
				vendor_business_license: {
					orderBy: {
						created_at: "desc",
					},
					select: {
						id: true,
						license_type: true,
						license_number: true,
						qualification: true,
						issued_date: true,
						expiry_date: true,
						issuer: true,
						status: true,
					},
				},
				vendor_management: {
					where: {
						is_active: true,
					},
					orderBy: {
						created_at: "asc",
					},
					select: {
						id: true,
						full_name: true,
						position_title: true,
						phone: true,
						email: true,
					},
				},
			},
		});

		if (!vendor) {
			return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
		}

		return NextResponse.json(vendor);
	} catch (error) {
		console.error("Error fetching vendor detail:", error);
		return NextResponse.json(
			{ error: "Failed to fetch vendor detail" },
			{ status: 500 }
		);
	}
}
