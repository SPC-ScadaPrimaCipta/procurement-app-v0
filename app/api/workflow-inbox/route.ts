import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
	// 1️⃣ Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;

	// 2️⃣ Pagination & Filters
	const { searchParams } = new URL(req.url);
	const page = Number(searchParams.get("page") ?? 1);
	const pageSize = Number(searchParams.get("pageSize") ?? 20);
	const type = searchParams.get("type") ?? "pending"; // pending | history
	const showAll = searchParams.get("all") === "true";

	const skip = showAll ? undefined : (page - 1) * pageSize;
	const take = showAll ? undefined : pageSize;

	let whereClause: any = {};
	let orderBy: any = {};

	if (type === "history") {
		whereClause = {
			acted_by: userId,
		};
		orderBy = {
			acted_at: "desc", // Show most recent actions first
		};
	} else {
		whereClause = {
			status: "PENDING",
			OR: [
				{
					assigned_to: {
						array_contains: userId,
					},
				},
				{
					assigned_to: {
						array_contains: JSON.stringify([userId]),
					},
				},
			],
			workflow_instance: {
				status: "IN_PROGRESS",
			},
		};
		orderBy = {
			created_at: "desc", // Show oldest pending tasks first
		};
	}

	// 3️⃣ Query inbox
	const [items, total] = await prisma.$transaction([
		prisma.workflow_step_instance.findMany({
			where: whereClause,
			include: {
				step: true,
				workflow_instance: {
					include: {
						workflow: true,
					},
				},
			},
			orderBy,
			skip,
			take,
		}),

		prisma.workflow_step_instance.count({
			where: whereClause,
		}),
	]);

	// Fetch user names for requestedBy
	const creatorIds = Array.from(
		new Set(items.map((item) => item.workflow_instance.created_by))
	);
	const users = await prisma.user.findMany({
		where: {
			id: {
				in: creatorIds,
			},
		},
		select: {
			id: true,
			name: true,
			email: true,
		},
	});

	const userMap = new Map(
		users.map((u) => [u.id, u.name || u.email || "Unknown"])
	);

	// 4️⃣ Response shaping (frontend friendly)
	const result = items.map((item) => ({
		id: item.id,
		stepInstanceId: item.id,
		workflowInstanceId: item.workflow_instance_id,

		title: item.workflow_instance.workflow.name,
		stepName: item.step.name,

		status: item.status,
		requestedBy:
			userMap.get(item.workflow_instance.created_by) ??
			item.workflow_instance.created_by,
		createdAt: item.created_at,
		actedAt: item.acted_at,

		// Extra metadata
		workflowCode: item.workflow_instance.workflow.code,
		workflowVersion: item.workflow_instance.workflow.version,
		stepKey: item.step.step_key,
		refType: item.workflow_instance.ref_type,
		refId: item.workflow_instance.ref_id,
	}));

	return NextResponse.json({
		page: showAll ? 1 : page,
		pageSize: showAll ? total : pageSize,
		total,
		items: result,
	});
}
