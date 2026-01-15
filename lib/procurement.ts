import { Prisma } from "@prisma/client";

/**
 * Generates a unique case code for a procurement case.
 * Format: PROC-{YEAR}-{SEQ}
 * Example: PROC-2024-000001
 *
 * @param tx Prisma Transaction Client
 * @returns string case_code
 */
export async function generateCaseCode(
	tx: Prisma.TransactionClient
): Promise<string> {
	const now = new Date();
	const year = now.getFullYear();
	const prefix = `PROC-${year}-`;

	const lastCase = await tx.procurement_case.findFirst({
		where: {
			case_code: {
				startsWith: prefix,
			},
		},
		orderBy: {
			case_code: "desc",
		},
	});

	let seq = 1;
	if (lastCase?.case_code) {
		const parts = lastCase.case_code.split("-");
		const lastSeq = parseInt(parts[parts.length - 1]);
		if (!isNaN(lastSeq)) {
			seq = lastSeq + 1;
		}
	}

	const seqPadded = seq.toString().padStart(6, "0");
	return `${prefix}${seqPadded}`;
}
