import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";

export async function GET(req: Request) {
	const canRead = await hasPermission("read", "Contract");
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
						contract_number: {
							contains: search,
							mode: "insensitive" as const,
						},
					},
					{
						vendor: {
							vendor_name: {
								contains: search,
								mode: "insensitive" as const,
							},
						},
					},
				],
		  }
		: {};

	try {
		const [data, total] = await prisma.$transaction([
			prisma.contract.findMany({
				where: whereClause,
				include: {
					contract_status: true,
					vendor: true,
					procurement_case: {
						select: {
							id: true,
							title: true,
							case_code: true,
						},
					},
				},
				orderBy: {
					created_at: "desc",
				},
				skip,
				take: limit,
			}),
			prisma.contract.count({ where: whereClause }),
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
		console.error("Error fetching contracts:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
