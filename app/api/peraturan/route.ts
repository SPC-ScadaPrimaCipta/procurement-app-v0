import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: List all regulations
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
		const typeId = searchParams.get("type_id") || "";

		const skip = (page - 1) * limit;

		// Build where clause
		const where: any = {};

		if (search) {
			where.OR = [
				{ doc_number: { contains: search, mode: "insensitive" } },
				{ title: { contains: search, mode: "insensitive" } },
			];
		}

		if (typeId) {
			where.type_id = typeId;
		}

		const [regulations, total] = await Promise.all([
			prisma.regulation_document.findMany({
				where,
				skip,
				take: limit,
				orderBy: {
					created_at: "desc",
				},
				include: {
					type: {
						select: {
							name: true,
						},
					},
					files: {
						select: {
							id: true,
							file_name: true,
						},
						take: 1,
					},
				},
			}),
			prisma.regulation_document.count({ where }),
		]);

		return NextResponse.json({
			data: regulations,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching regulations:", error);
		return NextResponse.json(
			{ error: "Failed to fetch regulations" },
			{ status: 500 }
		);
	}
}

// POST: Create new regulation
export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { type_id, doc_number, title } = body;

		// Validate required fields
		if (!type_id || !doc_number || !title) {
			return NextResponse.json(
				{ error: "Type, document number, and title are required" },
				{ status: 400 }
			);
		}

		// Check for duplicate doc_number
		const existingRegulation = await prisma.regulation_document.findFirst({
			where: {
				doc_number,
			},
		});

		if (existingRegulation) {
			return NextResponse.json(
				{ error: "Document number already exists" },
				{ status: 400 }
			);
		}

		// Create regulation
		const regulation = await prisma.regulation_document.create({
			data: {
				type_id,
				doc_number,
				title,
				created_by: session.user.id,
			},
			include: {
				type: {
					select: {
						name: true,
					},
				},
			},
		});

		return NextResponse.json(regulation, { status: 201 });
	} catch (error) {
		console.error("Error creating regulation:", error);
		return NextResponse.json(
			{ error: "Failed to create regulation" },
			{ status: 500 }
		);
	}
}
