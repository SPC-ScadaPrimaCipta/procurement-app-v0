import prisma from "../prisma";
import { notifyUsers } from "./service";

export async function handleWorkflowCompleted(
	result: {
		workflowInstanceId: string;
		refType: string | null;
		refId: string | null;
	},
	actorId: string,
) {
	if (result.refType !== "PROCUREMENT_CASE" || !result.refId) return;

	const caseId = result.refId;

	const procurement = await prisma.procurement_case.findUnique({
		where: { id: caseId },
		select: { case_code: true },
	});

	if (!procurement) return;

	// resolve KPA (simple version dulu)
	const kpaUsers = await prisma.user.findMany({
		where: {
			roles: { some: { name: "KPA" } },
		},
		select: { id: true },
	});

	if (!kpaUsers.length) return;

	await notifyUsers({
		recipients: kpaUsers.map((u) => ({ userId: u.id })),
		title: "Pengadaan telah selesai",
		message: `Pengadaan ${procurement.case_code} telah selesai disetujui.`,
		severity: "INFO",
		refType: "PROCUREMENT_CASE",
		refId: caseId,
		actionUrl: `/pengadaan/${caseId}`,
		dedupeKeyPrefix: `WF:COMPLETED:PROCUREMENT_CASE:${caseId}`,
		createdBy: actorId,
	});
}
