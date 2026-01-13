import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/vendors/[id]/bank-accounts - Create bank account
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
		const {
			account_number,
			account_name,
			bank_name,
			branch_name,
			currency_code,
			is_primary,
		} = body;

		// Validation
		if (!account_number) {
			return NextResponse.json(
				{ error: "Account number is required" },
				{ status: 400 }
			);
		}

		// Check if vendor exists
		const vendor = await prisma.vendor.findUnique({
			where: { id: vendorId },
		});

		if (!vendor) {
			return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
		}

		// Check if account number already exists for this vendor
		const existingAccount = await prisma.vendor_bank_account.findFirst({
			where: {
				vendor_id: vendorId,
				account_number,
			},
		});

		if (existingAccount) {
			return NextResponse.json(
				{ error: "Account number already exists for this vendor" },
				{ status: 400 }
			);
		}

		// If is_primary is true, set all other accounts to is_primary = false
		if (is_primary) {
			await prisma.vendor_bank_account.updateMany({
				where: {
					vendor_id: vendorId,
					is_primary: true,
				},
				data: {
					is_primary: false,
				},
			});
		}

		const bankAccount = await prisma.vendor_bank_account.create({
			data: {
				vendor_id: vendorId,
				account_number,
				account_name: account_name || null,
				bank_name: bank_name || null,
				branch_name: branch_name || null,
				currency_code: currency_code || "IDR",
				is_primary: is_primary ?? false,
				is_active: true,
				created_by: session.user.id,
			},
		});

		return NextResponse.json(bankAccount, { status: 201 });
	} catch (error) {
		console.error("Error creating bank account:", error);
		return NextResponse.json(
			{ error: "Failed to create bank account" },
			{ status: 500 }
		);
	}
}
