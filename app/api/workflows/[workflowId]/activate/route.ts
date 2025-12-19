import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function POST(
	req: Request,
	{ params }: { params: { code: string } }
) {
	const canUpdate = await hasPermission("update", "workflows");
	if (!canUpdate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	const { version } = await req.json();

	if (!version) {
		return new NextResponse("Version is required", { status: 400 });
	}

	return prisma.$transaction(async (tx) => {
		// 1️⃣ Deactivate all versions
		await tx.workflow.updateMany({
			where: { code: params.code },
			data: { is_active: false },
		});

		// 2️⃣ Activate target version
		const updated = await tx.workflow.updateMany({
			where: {
				code: params.code,
				version,
			},
			data: { is_active: true },
		});

		if (updated.count === 0) {
			return new NextResponse("Workflow version not found", {
				status: 404,
			});
		}

		return NextResponse.json({
			code: params.code,
			version,
			status: "ACTIVATED",
		});
	});
}
