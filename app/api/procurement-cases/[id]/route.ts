import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";
import { resolveUserName } from "@/lib/user-utils";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const canRead = await hasPermission("read", "pengadaan");
	if (!canRead) {
		return new NextResponse("Forbidden", { status: 403 });
	}

	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		const data = await prisma.procurement_case.findUnique({
			where: { id },
			include: {
				status: true,
				unit: true,
				correspondence_in: true,
				correspondence_out: true,
				contract: {
					include: {
						vendor: true,
						contract_status: true,
						procurement_method: true,
					},
				},
				case_disposition_summary: true,
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
		});

		if (!data) {
			return new NextResponse("Not Found", { status: 404 });
		}

		// Resolve creator names
		const createdByName = await resolveUserName(data.created_by);
		const correspondenceInCreator = data.correspondence_in
			? await resolveUserName(data.correspondence_in.created_by)
			: null;

		// Map correspondence_out creators
		const correspondenceOutWithNames = await Promise.all(
			data.correspondence_out.map(async (item) => ({
				...item,
				created_by_name: await resolveUserName(item.created_by),
			}))
		);

		let currentStepInstanceId = null;

		if (session?.user?.id) {
			const workflowInstance = await prisma.workflow_instance.findUnique({
				where: {
					ref_type_ref_id: {
						ref_type: "PROCUREMENT_CASE",
						ref_id: id,
					},
				},
			});

			if (workflowInstance) {
				const stepInstances =
					await prisma.workflow_step_instance.findMany({
						where: {
							workflow_instance_id: workflowInstance.id,
							status: "PENDING",
						},
					});

				const assignment = stepInstances.find((step) => {
					const assigned = step.assigned_to as string[];
					return (
						Array.isArray(assigned) &&
						assigned.includes(session.user.id)
					);
				});

				if (assignment) {
					currentStepInstanceId = assignment.id;
				}
			}
		}

		return NextResponse.json({
			...data,
			created_by_name: createdByName,
			correspondence_in: data.correspondence_in
				? {
						...data.correspondence_in,
						created_by_name: correspondenceInCreator,
				  }
				: null,
			correspondence_out: correspondenceOutWithNames,
			currentStepInstanceId,
		});
	} catch (error) {
		console.error("Error fetching procurement case details:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
