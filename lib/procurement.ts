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
	const startOfYear = new Date(year, 0, 1);
	const nextYear = new Date(year + 1, 0, 1);

	const count = await tx.procurement_case.count({
		where: {
			created_at: {
				gte: startOfYear,
				lt: nextYear,
			},
		},
	});

	const seq = count + 1;
	const seqPadded = seq.toString().padStart(6, "0");
	return `PROC-${year}-${seqPadded}`;
}
