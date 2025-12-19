import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ workflowId: string }> }
) {
	const { workflowId } = await params;

	const canRead = await hasPermission("read", "workflows");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const workflow = await prisma.workflow.findUnique({
		where: { id: workflowId },
	});

	if (!workflow) {
		return new NextResponse("Workflow not found", { status: 404 });
	}

	return NextResponse.json(workflow);
}
