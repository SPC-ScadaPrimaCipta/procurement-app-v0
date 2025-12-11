import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hasPermission } from "@/lib/rbac";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const limit = parseInt(searchParams.get("limit") || "10");
	const offset = parseInt(searchParams.get("offset") || "0");
	const search = searchParams.get("search") || "";

	const canReadUsers = await hasPermission("read", "users");
	if (!canReadUsers) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const where: any = {};
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: "insensitive" } },
				{ email: { contains: search, mode: "insensitive" } },
			];
		}

		const [users, total] = await Promise.all([
			prisma.user.findMany({
				where,
				take: limit,
				skip: offset,
				orderBy: { createdAt: "desc" },
				include: {
					roles: true, // Include roles for display
				},
			}),
			prisma.user.count({ where }),
		]);

		return NextResponse.json({
			users,
			total,
		});
	} catch (error) {
		console.error("List users error", error);
		return new NextResponse("Internal Error", { status: 500 });
	}
}
