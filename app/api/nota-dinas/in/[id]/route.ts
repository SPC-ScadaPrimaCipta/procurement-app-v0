import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canRead = await hasPermission("read", "NotaDinas");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const result = await prisma.correspondence_in.findUnique({
			where: { id },
			include: {
				procurement_case: {
					include: {
						status: true,
						unit: true,
						document: {
							include: {
								master_doc_type: true,
								document_file: true,
							},
						},
					},
				},
			},
		});

		if (!result) {
			return new NextResponse("Not Found", { status: 404 });
		}

		const createdByName = await resolveUserName(result.created_by);

		return NextResponse.json({
			...result,
			created_by: createdByName,
		});
	} catch (error) {
		console.error("Error fetching nota dinas detail:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
