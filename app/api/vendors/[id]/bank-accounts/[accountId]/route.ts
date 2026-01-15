import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { deleteItemFromSiteDrive } from "@/lib/sharepoint";

// PUT /api/vendors/[id]/bank-accounts/[accountId] - Update bank account
export async function PUT(
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
		const body = await request.json();
		const {
			account_number,
			account_name,
			bank_name,
			branch_name,
			currency_code,
			is_primary,
		} = body;

		// Check if account exists
		const existingAccount = await prisma.vendor_bank_account.findUnique({
			where: { id: accountId },
		});

		if (!existingAccount) {
			return NextResponse.json(
				{ error: "Bank account not found" },
				{ status: 404 }
			);
		}

		// Check if account belongs to this vendor
		if (existingAccount.vendor_id !== vendorId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Check if account number already exists (if changed)
		if (account_number && account_number !== existingAccount.account_number) {
			const duplicateAccount = await prisma.vendor_bank_account.findFirst({
				where: {
					vendor_id: vendorId,
					account_number,
					id: { not: accountId },
				},
			});

			if (duplicateAccount) {
				return NextResponse.json(
					{ error: "Account number already exists for this vendor" },
					{ status: 400 }
				);
			}
		}

		// If is_primary is true, set all other accounts to is_primary = false
		if (is_primary && !existingAccount.is_primary) {
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

		const updatedAccount = await prisma.vendor_bank_account.update({
			where: { id: accountId },
			data: {
				account_number: account_number || existingAccount.account_number,
				account_name:
					account_name !== undefined ? account_name : existingAccount.account_name,
				bank_name: bank_name !== undefined ? bank_name : existingAccount.bank_name,
				branch_name:
					branch_name !== undefined ? branch_name : existingAccount.branch_name,
				currency_code:
					currency_code !== undefined
						? currency_code
						: existingAccount.currency_code,
				is_primary: is_primary !== undefined ? is_primary : existingAccount.is_primary,
			},
		});

		return NextResponse.json(updatedAccount);
	} catch (error) {
		console.error("Error updating bank account:", error);
		return NextResponse.json(
			{ error: "Failed to update bank account" },
			{ status: 500 }
		);
	}
}

// DELETE /api/vendors/[id]/bank-accounts/[accountId] - Delete bank account
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

		const { id: vendorId, accountId } = await params;

		// Check if account exists
		const existingAccount = await prisma.vendor_bank_account.findUnique({
			where: { id: accountId },
		});

		if (!existingAccount) {
			return NextResponse.json(
				{ error: "Bank account not found" },
				{ status: 404 }
			);
		}

		// Check if account belongs to this vendor
		if (existingAccount.vendor_id !== vendorId) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Delete associated documents from SharePoint and database
		const documents = await prisma.document.findMany({
			where: {
				ref_type: "VENDOR_BANK_ACCOUNT",
				ref_id: accountId,
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
								`Deleted bank account document from SharePoint: ${doc.file_name}`
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
					ref_type: "VENDOR_BANK_ACCOUNT",
					ref_id: accountId,
				},
			});
		}

		// Soft delete by setting is_active to false
		await prisma.vendor_bank_account.update({
			where: { id: accountId },
			data: {
				is_active: false,
			},
		});

		return NextResponse.json({ message: "Bank account deleted successfully" });
	} catch (error) {
		console.error("Error deleting bank account:", error);
		return NextResponse.json(
			{ error: "Failed to delete bank account" },
			{ status: 500 }
		);
	}
}
