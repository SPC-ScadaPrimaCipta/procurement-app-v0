import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";

export async function GET(req: Request) {
	const canRead = await hasPermission("read", "Procurement");
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
						title: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
					{
						case_code: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
				],
		  }
		: {};

	try {
		const [data, total] = await prisma.$transaction([
			prisma.procurement_case.findMany({
				where: whereClause,
				include: {
					status: true,
					unit: true,
				},
				orderBy: {
					created_at: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.procurement_case.count({ where: whereClause }),
		]);

		const enhancedData = await Promise.all(
			data.map(async (item) => ({
				...item,
				created_by_name: await resolveUserName(item.created_by),
			}))
		);

		return NextResponse.json({
			data: enhancedData,
			meta: {
				total,
				page,
				limit,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching procurement cases:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
