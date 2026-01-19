import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> } // Params is a Promise in Next.js 15
) {
	const { id } = await params;
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const caseId = id;
	const body = await request.json();
	const { requirementId, status, notes } = body;

	if (!requirementId || !status) {
		return NextResponse.json(
			{ error: "Missing required fields: requirementId, status" },
			{ status: 400 }
		);
	}

	if (!["PASS", "FAIL"].includes(status)) {
		return NextResponse.json(
			{ error: "Invalid status. Must be PASS or FAIL" },
			{ status: 400 }
		);
	}

	try {
		// 1. Verify the requirement exists and is indeed MANUAL
		const requirement = await prisma.step_requirement.findUnique({
			where: { id: requirementId },
		});

		if (!requirement) {
			return NextResponse.json(
				{ error: "Requirement not found" },
				{ status: 404 }
			);
		}

		if (requirement.check_mode !== "MANUAL") {
			return NextResponse.json(
				{ error: "This requirement is not manual" },
				{ status: 400 }
			);
		}

		// 2. Upsert case_requirement_check
		const check = await prisma.case_requirement_check.upsert({
			where: {
				case_id_requirement_id: {
					case_id: caseId,
					requirement_id: requirementId,
				},
			},
			create: {
				case_id: caseId,
				requirement_id: requirementId,
				status: status,
				notes: notes,
				checked_by: session.user.email || session.user.name || "System",
				checked_at: new Date(),
			},
			update: {
				status: status,
				notes: notes,
				checked_by: session.user.email || session.user.name || "System",
				checked_at: new Date(),
				updated_at: new Date(),
			},
		});

		return NextResponse.json({ success: true, data: check });
	} catch (error: any) {
		console.error("Error verifying checklist:", error);
		return NextResponse.json(
			{ error: error.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
