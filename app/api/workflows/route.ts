import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { headers } from "next/headers";

export async function GET() {
	const canRead = await hasPermission("read", "workflows");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const workflows = await prisma.workflow.findMany({
		orderBy: [{ code: "asc" }, { version: "desc" }],
		include: {
			workflow_step: {
				orderBy: { step_order: "asc" },
			},
		},
	});

	return NextResponse.json(workflows);
}

export async function POST(req: Request) {
	const canCreate = await hasPermission("create", "workflows");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { code, name, description } = await req.json();

	if (!code || !name) {
		return new NextResponse("Invalid payload", { status: 400 });
	}

	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	return prisma.$transaction(async (tx) => {
		const lastVersion = await tx.workflow.findFirst({
			where: { code },
			orderBy: { version: "desc" },
		});

		const nextVersion = lastVersion ? lastVersion.version + 1 : 1;

		const workflow = await tx.workflow.create({
			data: {
				code,
				name,
				description,
				version: nextVersion,
				is_active: false,
				created_by: session.user.id,
			},
		});

		return NextResponse.json({
			workflowId: workflow.id,
			version: workflow.version,
		});
	});
}
