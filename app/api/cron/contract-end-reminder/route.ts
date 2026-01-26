import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { addDays, format } from "date-fns";
import { notifyUsers } from "@/lib/notifications/service";

export async function POST(req: Request) {
	// 1) Auth via secret (n8n or other cron service)
	const secret = req.headers.get("x-cron-secret");
	if (!secret || secret !== process.env.CRON_SECRET) {
		return new NextResponse("Unauthorized", { status: 401 });
	}

	// 2) Parse body
	let daysBeforeEnd = 3;
	try {
		const body = await req.json().catch(() => null);
		if (body?.daysBeforeEnd != null) {
			daysBeforeEnd = Number(body.daysBeforeEnd);
		}
	} catch (error) {
		// Ignore JSON parse errors, rely on default
	}

	if (
		!Number.isFinite(daysBeforeEnd) ||
		daysBeforeEnd < 0 ||
		daysBeforeEnd > 60
	) {
		return new NextResponse("Invalid daysBeforeEnd", { status: 400 });
	}

	// Compute target date (Asia/Jakarta = UTC+7)
	const now = new Date();
	const utcKey = now.getTime() + now.getTimezoneOffset() * 60000;
	const jakartaOffset = 7 * 60 * 60 * 1000;
	const jakartaNow = new Date(utcKey + jakartaOffset);

	const targetDateObj = addDays(jakartaNow, daysBeforeEnd);
	const targetDate = format(targetDateObj, "yyyy-MM-dd");

	// Find contracts ending on targetDate
	const startQuery = new Date(targetDate);
	startQuery.setUTCHours(0, 0, 0, 0);

	const endQuery = new Date(targetDate);
	endQuery.setUTCHours(23, 59, 59, 999);

	const contracts = await prisma.contract.findMany({
		where: {
			end_date: {
				gte: startQuery,
				lte: endQuery,
			},
		},
		select: {
			id: true,
			case_id: true,
			contract_number: true,
			end_date: true,
			created_by: true,
		},
	});

	let created = 0;
	let skipped = 0;

	for (const c of contracts) {
		const endStr = format(c.end_date, "yyyy-MM-dd");
		const dedupeKeyPrefix = `REMINDER:CONTRACT_END:D-${daysBeforeEnd}:CONTRACT:${c.id}:END:${endStr}`;

		// recipient
		const recipientUserId = c.created_by;
		if (!recipientUserId) {
			skipped++;
			continue;
		}

		// Insert notification (idempotent by dedupe_key logic in notifyUsers/service)
		await notifyUsers({
			recipients: [{ userId: recipientUserId }],
			title: "Kontrak akan berakhir",
			message: `Kontrak ${c.contract_number ?? "-"} akan berakhir pada ${endStr}. Mohon pastikan dokumen akhir (BAST/PHO/FHO) sudah lengkap.`,
			severity: "ACTION_REQUIRED",
			refType: "CONTRACT",
			refId: c.id,
			actionUrl: `/kontrak/${c.id}`,
			dedupeKeyPrefix,
			createdBy: "SYSTEM",
		});

		created++;
	}

	return NextResponse.json({
		ok: true,
		daysBeforeEnd,
		targetDate,
		checked: contracts.length,
		created,
		skipped,
	});
}
