import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user?.id) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	const userId = session.user.id;
	const { stepInstanceId, comment } = await req.json();

	if (!stepInstanceId) {
		return new NextResponse("stepInstanceId required", { status: 400 });
	}

	return prisma.$transaction(async (tx) => {
		const stepInstance = await tx.workflow_step_instance.findUnique({
			where: { id: stepInstanceId },
			include: {
				workflow_instance: true,
				step: true,
			},
		});

		if (!stepInstance) {
			return new NextResponse("Step instance not found", { status: 404 });
		}

		if (stepInstance.status !== "PENDING") {
			return new NextResponse("Step is not pending", { status: 409 });
		}

		const assigned = stepInstance.assigned_to as string[];
		if (!assigned.includes(userId)) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		// 1️⃣ Reject step
		await tx.workflow_step_instance.update({
			where: { id: stepInstanceId },
			data: {
				status: "REJECTED",
				acted_by: userId,
				acted_at: new Date(),
				comment,
			},
		});

		// 2️⃣ Reject workflow
		await tx.workflow_instance.update({
			where: { id: stepInstance.workflow_instance_id },
			data: {
				status: "REJECTED",
				current_step_id: null,
			},
		});

		// 3️⃣ Log action
		await tx.workflow_action_log.create({
			data: {
				workflow_instance_id: stepInstance.workflow_instance_id,
				action: "REJECT",
				from_step_id: stepInstance.step_id,
				actor_id: userId,
				comment,
			},
		});

		return NextResponse.json({ status: "REJECTED" });
	});
}
