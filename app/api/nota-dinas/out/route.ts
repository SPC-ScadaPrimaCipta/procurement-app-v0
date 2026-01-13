import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
	const canRead = await hasPermission("read", "notadinas");
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
					{
						to_name: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				],
		  }
		: {};

	try {
		const [data, total] = await prisma.$transaction([
			prisma.correspondence_out.findMany({
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
			prisma.correspondence_out.count({ where: whereClause }),
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
		console.error("Error fetching nota dinas out:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
