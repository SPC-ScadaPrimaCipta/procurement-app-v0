import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { jsonResponse } from "@/lib/json-response";
import { deleteItemFromSiteDrive } from "@/lib/sharepoint";

export const dynamic = "force-dynamic";

// GET: Get reimbursement detail
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

		const reimbursement = await prisma.reimbursement.findUnique({
			where: { id },
			include: {
				vendor: {
					select: {
						id: true,
						vendor_name: true,
						npwp: true,
						address: true,
					},
				},
				status: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (!reimbursement) {
			return NextResponse.json(
				{ error: "Reimbursement not found" },
				{ status: 404 }
			);
		}

		return jsonResponse(reimbursement);
	} catch (error) {
		console.error("Error fetching reimbursement:", error);
		return NextResponse.json(
			{ error: "Failed to fetch reimbursement" },
			{ status: 500 }
		);
	}
}

// PUT: Update reimbursement
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
		const {
			no_validasi_ppk,
			tgl_validasi_ppk,
			vendor_id,
			nomor_kwitansi,
			tanggal_kwitansi,
			uraian_pekerjaan,
			nilai_kwitansi,
			status_id,
			keterangan,
		} = body;

		// Validate required fields
		if (
			!no_validasi_ppk ||
			!tgl_validasi_ppk ||
			!vendor_id ||
			!nomor_kwitansi ||
			!tanggal_kwitansi ||
			!uraian_pekerjaan ||
			nilai_kwitansi === undefined ||
			!status_id
		) {
			return NextResponse.json(
				{ error: "All required fields must be filled" },
				{ status: 400 }
			);
		}

		// Check if reimbursement exists
		const existingReimbursement = await prisma.reimbursement.findUnique({
			where: { id },
		});

		if (!existingReimbursement) {
			return NextResponse.json(
				{ error: "Reimbursement not found" },
				{ status: 404 }
			);
		}

		// Update reimbursement
		const reimbursement = await prisma.reimbursement.update({
			where: { id },
			data: {
				no_validasi_ppk,
				tgl_validasi_ppk: new Date(tgl_validasi_ppk),
				vendor_id,
				nomor_kwitansi,
				tanggal_kwitansi: new Date(tanggal_kwitansi),
				uraian_pekerjaan,
				nilai_kwitansi: parseFloat(nilai_kwitansi),
				status_id,
				keterangan: keterangan || null,
				updated_at: new Date(),
			},
			include: {
				vendor: {
					select: {
						vendor_name: true,
					},
				},
				status: {
					select: {
						name: true,
					},
				},
			},
		});

		return NextResponse.json(reimbursement);
	} catch (error) {
		console.error("Error updating reimbursement:", error);
		return NextResponse.json(
			{ error: "Failed to update reimbursement" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete reimbursement
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

		// Check if reimbursement exists
		const existingReimbursement = await prisma.reimbursement.findUnique({
			where: { id },
		});

		if (!existingReimbursement) {
			return NextResponse.json(
				{ error: "Reimbursement not found" },
				{ status: 404 }
			);
		}

		// Delete associated documents from SharePoint and database
		const documents = await prisma.document.findMany({
			where: {
				ref_type: "REIMBURSEMENT",
				ref_id: id,
			},
		});

		if (documents.length > 0) {
			// Get access token for SharePoint
			const account = await prisma.account.findFirst({
				where: {
					providerId: "microsoft",
				},
				select: {
					accessToken: true,
				},
			});

			if (account?.accessToken) {
				// Get siteId from environment
				const siteId = process.env.SHAREPOINT_SITE_ID;
				if (!siteId) {
					console.error("SHAREPOINT_SITE_ID not configured");
				} else {
					// Delete files from SharePoint
					for (const doc of documents) {
						if (doc.sp_item_id) {
							try {
								await deleteItemFromSiteDrive({
									siteId,
									accessToken: account.accessToken,
									itemId: doc.sp_item_id,
								});
							} catch (error) {
								console.error(`Failed to delete file from SharePoint: ${doc.file_name}`, error);
							}
						}
					}
				}
			}

			// Delete documents from database
			await prisma.document.deleteMany({
				where: {
					ref_type: "REIMBURSEMENT",
					ref_id: id,
				},
			});
		}

		// Delete reimbursement
		await prisma.reimbursement.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Reimbursement deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting reimbursement:", error);
		return NextResponse.json(
			{ error: "Failed to delete reimbursement" },
			{ status: 500 }
		);
	}
}
