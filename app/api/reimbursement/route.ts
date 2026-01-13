import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: List all reimbursements
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "1000");
		const search = searchParams.get("search") || "";
		const statusId = searchParams.get("status_id") || "";

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};

		if (search) {
			where.OR = [
				{ reimbursement_no: { contains: search, mode: "insensitive" } },
				{ no_validasi_ppk: { contains: search, mode: "insensitive" } },
				{ nomor_kwitansi: { contains: search, mode: "insensitive" } },
				{ uraian_pekerjaan: { contains: search, mode: "insensitive" } },
				{
					vendor: {
						vendor_name: { contains: search, mode: "insensitive" },
					},
				},
			];
		}

		if (statusId) {
			where.status_id = statusId;
		}

		const [reimbursements, total] = await Promise.all([
			prisma.reimbursement.findMany({
				where,
				skip,
				take: limit,
				orderBy: {
					created_at: "desc",
				},
				include: {
					vendor: {
						select: {
							id: true,
							vendor_name: true,
						},
					},
					status: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			}),
			prisma.reimbursement.count({ where }),
		]);

		return NextResponse.json({
			data: reimbursements,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching reimbursements:", error);
		return NextResponse.json(
			{ error: "Failed to fetch reimbursements" },
			{ status: 500 }
		);
	}
}

// POST: Create new reimbursement
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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

		// Generate reimbursement_no (format: REIMB-XXXXXX)
		const timestamp = Date.now().toString(36).toUpperCase();
		const random = Math.random().toString(36).substring(2, 8).toUpperCase();
		const reimbursement_no = `REIMB-${timestamp}${random}`;

		// Create reimbursement
		const reimbursement = await prisma.reimbursement.create({
			data: {
				reimbursement_no,
				no_validasi_ppk,
				tgl_validasi_ppk: new Date(tgl_validasi_ppk),
				vendor_id,
				nomor_kwitansi,
				tanggal_kwitansi: new Date(tanggal_kwitansi),
				uraian_pekerjaan,
				nilai_kwitansi: parseFloat(nilai_kwitansi),
				status_id,
				keterangan: keterangan || null,
				created_by: session.user.id,
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

		return NextResponse.json(reimbursement, { status: 201 });
	} catch (error) {
		console.error("Error creating reimbursement:", error);
		return NextResponse.json(
			{ error: "Failed to create reimbursement" },
			{ status: 500 }
		);
	}
}
