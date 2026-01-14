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
						document: {
							include: {
								master_doc_type: true,
								document_file: true,
							},
							orderBy: {
								created_at: "desc",
							},
						},
					},
				},
				contract_payment_plan: {
					orderBy: {
						line_no: "asc",
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

		const createdByName = await resolveUserName(data.created_by);

		return NextResponse.json({
			...data,
			created_by_name: createdByName,
		});
	} catch (error) {
		console.error("Error fetching contract details:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
