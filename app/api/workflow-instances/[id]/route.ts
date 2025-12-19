import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function GET(
	req: Request,
	{ params }: { params: { id: string } }
) {
	const canRead = await hasPermission("read", "workflow_instances");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const instance = await prisma.workflow_instance.findUnique({
		where: { id: params.id },
		include: {
			workflow: true,
			workflow_step_instance: {
				orderBy: { created_at: "asc" },
				include: {
					step: true,
				},
			},
		},
	});

	if (!instance) {
		return new NextResponse("Not Found", { status: 404 });
	}

	return NextResponse.json(instance);
}
