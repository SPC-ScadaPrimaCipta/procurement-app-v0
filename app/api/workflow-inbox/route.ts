import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(req: Request) {
	// 1️⃣ Auth
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;

	// 2️⃣ Pagination
	const { searchParams } = new URL(req.url);
	const page = Number(searchParams.get("page") ?? 1);
	const pageSize = Number(searchParams.get("pageSize") ?? 20);

	const skip = (page - 1) * pageSize;

	// 3️⃣ Query inbox
	const [items, total] = await prisma.$transaction([
		prisma.workflow_step_instance.findMany({
			where: {
				status: "PENDING",
				assigned_to: {
					array_contains: userId,
				},
				workflow_instance: {
					status: "IN_PROGRESS",
				},
			},
			include: {
				step: true,
				workflow_instance: {
					include: {
						workflow: true,
					},
				},
			},
			orderBy: {
				created_at: "asc",
			},
			skip,
			take: pageSize,
		}),

		prisma.workflow_step_instance.count({
			where: {
				status: "PENDING",
				assigned_to: {
					array_contains: userId,
				},
				workflow_instance: {
					status: "IN_PROGRESS",
				},
			},
		}),
	]);

	// 4️⃣ Response shaping (frontend friendly)
	const result = items.map((item) => ({
		stepInstanceId: item.id,
		workflowInstanceId: item.workflow_instance_id,

		workflowCode: item.workflow_instance.workflow.code,
		workflowName: item.workflow_instance.workflow.name,
		workflowVersion: item.workflow_instance.workflow.version,

		stepKey: item.step.step_key,
		stepName: item.step.name,

		refType: item.workflow_instance.ref_type,
		refId: item.workflow_instance.ref_id,

		createdAt: item.created_at,
	}));

	return NextResponse.json({
		page,
		pageSize,
		total,
		items: result,
	});
}
