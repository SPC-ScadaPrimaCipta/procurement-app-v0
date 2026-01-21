import prisma from "@/lib/prisma";

type NotifyInput = {
	recipients: { userId: string }[];
	title: string;
	message?: string;
	severity: "INFO" | "WARNING" | "ACTION_REQUIRED";
	refType?: string;
	refId?: string; // uuid string
	actionUrl?: string;
	dedupeKeyPrefix: string; // event identity
	createdBy?: string; // default SYSTEM
};

export async function notifyUsers(input: NotifyInput) {
	const createdBy = input.createdBy ?? "SYSTEM";

	const rows = input.recipients.map((r) => ({
		recipient_type: "USER" as const,
		recipient_id: r.userId,
		title: input.title,
		message: input.message ?? null,
		severity: input.severity,

		ref_type: input.refType ?? null,
		ref_id: input.refId ?? null,
		action_url: input.actionUrl ?? null,

		// per-user unique to prevent duplicates
		dedupe_key: `${input.dedupeKeyPrefix}:USER:${r.userId}`,
		created_by: createdBy,
	}));

	await prisma.notification.createMany({
		data: rows,
		skipDuplicates: true,
	});
}
