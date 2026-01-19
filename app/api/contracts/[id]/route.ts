import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canRead = await hasPermission("read", "kontrak");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const data = await prisma.contract.findUnique({
			where: { id },
			include: {
				contract_status: true,
				vendor: true,
				procurement_method: true,
				procurement_case: {
					select: {
						id: true,
						title: true,
						case_code: true,
					},
				},
				contract_payment_plan: {
					orderBy: {
						line_no: "asc",
					},
					include: {
						bast: true, // Include BAST for each payment plan
					},
				},
				bast: {
					orderBy: {
						bast_date: "asc",
					},
				},
			},
		});

		if (!data) {
			return new NextResponse("Not Found", { status: 404 });
		}

		// Fetch documents separately
		const documents = await prisma.document.findMany({
			where: {
				OR: [
					{
						ref_type: "PROCUREMENT_CASE",
						ref_id: data.case_id,
					},
					{
						ref_type: "BAST",
						// Filter by contract ID OR by specific BAST IDs
						// Since we updated BAST creation to link to BAST ID, we should check both or just BAST IDs.
						// Safest is to fetch by Contract ID (legacy/general) AND BAST IDs.
						// But for now, let's just fetch all BAST docs that might be linked.
						// Actually, finding by ContractId is NOT enough if we changed ref_id to BastId.
						// So we need to collect BastIds.
						ref_id: {
							in: [
								id, // Contract ID check
								...data.bast.map((b) => b.id), // All BAST IDs
							],
						},
					},
				],
			},
			include: {
				master_doc_type: true,
			},
			orderBy: {
				created_at: "desc",
			},
		});

		// Serialize documents to handle BigInt
		const serializedDocuments = documents.map((doc) => ({
			...doc,
			file_size: doc.file_size ? Number(doc.file_size) : null,
		}));

		const createdByName = await resolveUserName(data.created_by);

		// Distribute documents to their BASTs (Payment Plans)
		const paymentPlansWithBastAndDocs = data.contract_payment_plan.map(
			(plan) => {
				const planBasts = plan.bast.map((b) => {
					// Find docs for this BAST
					const bastDocs = serializedDocuments.filter(
						(d) =>
							d.ref_type === "BAST" &&
							(d.ref_id === b.id || d.ref_id === id) // Check both just in case
					);
					return {
						...b,
						document: bastDocs, // Assuming one doc per BAST for now
					};
				});
				return {
					...plan,
					bast: planBasts,
				};
			}
		);

		// Distribute documents to top-level BASTs
		const bastsWithDocs = data.bast.map((b) => {
			const bastDocs = serializedDocuments.filter(
				(d) =>
					d.ref_type === "BAST" &&
					(d.ref_id === b.id || d.ref_id === id)
			);
			return {
				...b,
				document: bastDocs,
			};
		});

		const enhancedProcurementCase = {
			...data.procurement_case,
			document: serializedDocuments.filter(
				(d) => d.ref_type === "PROCUREMENT_CASE"
			),
		};

		return NextResponse.json({
			...data,
			contract_payment_plan: paymentPlansWithBastAndDocs, // Override with enriched data
			bast: bastsWithDocs, // Override with enriched data
			created_by_name: createdByName,
			procurement_case: enhancedProcurementCase,
		});
	} catch (error) {
		console.error("Error fetching contract details:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
