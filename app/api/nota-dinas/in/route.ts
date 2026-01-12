import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateCaseCode } from "@/lib/procurement";

export async function GET(req: Request) {
	const canRead = await hasPermission("read", "NotaDinas");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { searchParams } = new URL(req.url);
	const search = searchParams.get("search") || "";
	const page = parseInt(searchParams.get("page") || "1");
	const limit = parseInt(searchParams.get("limit") || "10");
	const skip = (page - 1) * limit;

	const whereClause = search
		? {
				OR: [
					{
						subject: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
					{
						letter_number: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				],
		  }
		: {};

	try {
		const [data, total] = await prisma.$transaction([
			prisma.correspondence_in.findMany({
				where: whereClause,
				include: {
					procurement_case: {
						select: {
							case_code: true,
							title: true,
							status_id: true,
							created_at: true,
							status: {
								select: {
									name: true,
								},
							},
						},
					},
				},
				orderBy: {
					created_at: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.correspondence_in.count({ where: whereClause }),
		]);

		return NextResponse.json({
			data,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching nota dinas:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}

export async function POST(req: Request) {
	const canCreate = await hasPermission("create", "NotaDinas");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const body = await req.json();
	const { from_name, letter_date, letter_number, subject, cc } = body;

	// Validation
	if (!from_name || !letter_date || !letter_number || !subject) {
		return new NextResponse("Missing required fields", { status: 400 });
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			// 1. Get Status 'DRAFT'
			let status = await tx.case_status.findUnique({
				where: { name: "DRAFT" },
			});

			if (!status) {
				// Try finding any status or create DRAFT if permissible?
				// Let's create DRAFT if missing for robustness in dev
				status = await tx.case_status.create({
					data: {
						name: "DRAFT",
						is_active: true,
						sort_order: 1,
						created_by: "system",
					},
				});
			}

			// 2. Generate Case Code
			const case_code = await generateCaseCode(tx);

			// 3. Create Procurement Case
			const procurementCase = await tx.procurement_case.create({
				data: {
					case_code,
					title: subject,
					status_id: status.id,
					created_by: session.user.id,
				},
			});

			// 4. Create Correspondence In
			const correspondence = await tx.correspondence_in.create({
				data: {
					case_id: procurementCase.id,
					from_name,
					letter_date: new Date(letter_date), // Ensure it's Date object
					letter_number,
					subject,
					cc,
					received_date: new Date(), // Default today
					created_by: session.user.id,
				},
			});

			return {
				case_id: procurementCase.id,
				case_code: procurementCase.case_code,
			};
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating nota dinas:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
