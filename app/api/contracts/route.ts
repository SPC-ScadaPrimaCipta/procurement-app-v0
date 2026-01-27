import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
	const canRead = await hasPermission("read", "kontrak");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { searchParams } = new URL(req.url);
	const search = searchParams.get("search") || "";
	const showAll = searchParams.get("all") === "true";
	const page = parseInt(searchParams.get("page") || "1");
	const limit = parseInt(searchParams.get("limit") || "10");

	const skip = showAll ? undefined : (page - 1) * limit;
	const take = showAll ? undefined : limit;

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
				take,
			}),
			prisma.contract.count({ where: whereClause }),
		]);

		const enhancedData = await Promise.all(
			data.map(async (item) => ({
				...item,
				created_by_name: await resolveUserName(item.created_by),
			})),
		);

		return NextResponse.json({
			data: enhancedData,
			meta: {
				total,
				page: showAll ? 1 : page,
				limit: showAll ? total : limit,
				totalPages: showAll ? 1 : Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching contracts:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}

export async function POST(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const canCreate = await hasPermission("manage", "kontrak");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const body = await req.json();

		const {
			contract_number,
			contract_date,
			vendor_id,
			work_description,
			contract_value,
			start_date,
			end_date,
			procurement_method_id,
			contract_status_id,
			expense_type,
			procurement_case_id,
			procurement_type_id,
		} = body;

		const contract = await prisma.contract.create({
			data: {
				contract_number,
				contract_date: new Date(contract_date),
				vendor_id,
				work_description,
				contract_value,
				start_date: new Date(start_date),
				end_date: new Date(end_date),
				procurement_method_id,
				contract_status_id,
				expense_type,
				procurement_type_id,
				case_id: procurement_case_id,
				created_by: session.user.id,
			},
		});

		return NextResponse.json(contract);
	} catch (error) {
		console.error("Error creating contract:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
