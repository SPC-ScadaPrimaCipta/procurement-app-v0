import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/vendors - List all vendors with filters
export async function GET(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const supplierType = searchParams.get("supplierType") || "";
		const isActive = searchParams.get("isActive");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "1000");  // Large limit to show all
		const skip = (page - 1) * limit;

		const where: any = {};

		// Search by name or NPWP
		if (search) {
			where.OR = [
				{ vendor_name: { contains: search, mode: "insensitive" } },
				{ npwp: { contains: search, mode: "insensitive" } },
			];
		}

		// Filter by supplier type
		if (supplierType) {
			where.supplier_type_id = supplierType;
		}

		// Filter by active status
		if (isActive !== null && isActive !== undefined && isActive !== "") {
			where.is_active = isActive === "true";
		}

		const [vendors, total] = await Promise.all([
			prisma.vendor.findMany({
				where,
				include: {
					supplier_type: {
						select: {
							id: true,
							name: true,
						},
					},
					_count: {
						select: {
							contract: true,
						},
					},
				},
				orderBy: {
					created_at: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.vendor.count({ where }),
		]);

		return NextResponse.json({
			data: vendors,
			pagination: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching vendors:", error);
		return NextResponse.json(
			{ error: "Failed to fetch vendors" },
			{ status: 500 }
		);
	}
}

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { vendor_name, supplier_type_id, npwp, address, is_active } = body;

		// Validation
		if (!vendor_name || !supplier_type_id) {
			return NextResponse.json(
				{ error: "Vendor name and supplier type are required" },
				{ status: 400 }
			);
		}

		// Check if NPWP already exists (if provided)
		if (npwp) {
			const existingVendor = await prisma.vendor.findFirst({
				where: { npwp },
			});

			if (existingVendor) {
				return NextResponse.json(
					{ error: "NPWP already exists" },
					{ status: 400 }
				);
			}
		}

		const vendor = await prisma.vendor.create({
			data: {
				vendor_name,
				supplier_type_id,
				npwp: npwp || null,
				address: address || null,
				is_active: is_active ?? true,
				created_by: session.user.id,
			},
			include: {
				supplier_type: true,
			},
		});

		return NextResponse.json(vendor, { status: 201 });
	} catch (error) {
		console.error("Error creating vendor:", error);
		return NextResponse.json(
			{ error: "Failed to create vendor" },
			{ status: 500 }
		);
	}
}
