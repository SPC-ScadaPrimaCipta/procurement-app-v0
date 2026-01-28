import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: Request) {
	const canCreate = await hasPermission("create", "notadinas");
	if (!canCreate) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user?.id) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		const body = await req.json();
		const {
			letter_number,
			letter_date,
			from_name,
			to_name,
			subject,
			description,
			status,
		} = body;

		// Validation
		if (!letter_number || !letter_date || !from_name || !to_name || !subject) {
			return new NextResponse("Missing required fields", { status: 400 });
		}

		// Transaction to create case and correspondence
		const result = await prisma.$transaction(async (tx) => {
			// 1. Get Status 'DRAFT' or the provided status
			let statusRecord = await tx.case_status.findFirst({
				where: {
					name: status || "DRAFT",
				},
			});

			if (!statusRecord) {
				// Fallback to DRAFT
				statusRecord = await tx.case_status.findFirst({
					where: {
						name: "DRAFT",
					},
				});
			}

			if (!statusRecord) {
				throw new Error("Status not found");
			}

			// 2. Generate case code
			const now = new Date();
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, "0");

			// Count existing cases this month for sequential number
			const startOfMonth = new Date(year, now.getMonth(), 1);
			const endOfMonth = new Date(year, now.getMonth() + 1, 0, 23, 59, 59);

			const caseCount = await tx.procurement_case.count({
				where: {
					created_at: {
						gte: startOfMonth,
						lte: endOfMonth,
					},
				},
			});

			const sequentialNumber = String(caseCount + 1).padStart(3, "0");
			const caseCode = `SRTKLR/${sequentialNumber}/${month}/${year}`;

			// 3. Create procurement case
			const procurementCase = await tx.procurement_case.create({
				data: {
					case_code: caseCode,
					title: subject,
					status_id: statusRecord.id,
					created_by: session.user.id,
				},
			});

			// 4. Create correspondence_out
			const correspondenceOut = await tx.correspondence_out.create({
				data: {
					case_id: procurementCase.id,
					letter_number,
					letter_date: new Date(letter_date),
					from_name,
					to_name,
					subject,
					created_by: session.user.id,
				},
			});

			return {
				case_id: procurementCase.id,
				case_code: procurementCase.case_code,
				correspondence_id: correspondenceOut.id,
			};
		});

		return NextResponse.json(result);
	} catch (error) {
		console.error("Error creating surat keluar:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
