import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET(
	req: Request,
	{ params }: { params: { instanceId: string } }
) {
	const canRead = await hasPermission("read", "workflow_history");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const history = await prisma.workflow_action_log.findMany({
		where: {
			workflow_instance_id: params.instanceId,
		},
		orderBy: {
			created_at: "asc",
		},
	});

	return NextResponse.json(history);
}
