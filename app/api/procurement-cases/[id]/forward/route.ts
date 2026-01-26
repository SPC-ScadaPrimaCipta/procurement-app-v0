import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const requestHeaders = await headers();
		const session = await auth.api.getSession({
			headers: requestHeaders,
		});

		if (!session?.user) {
			return new NextResponse("Unauthorized", { status: 401 });
		}

		// Parse request body for optional remarks
		let remarks = null;
		try {
			const body = await request.json();
			remarks = body.remarks;
		} catch (e) {
			// No body or invalid JSON, that's okay
		}

		// 1. Get current case and its status
		const currentCase = await prisma.procurement_case.findUnique({
			where: { id },
			include: { status: true },
		});

		if (!currentCase || !currentCase.status) {
			return new NextResponse("Case or case status not found", {
				status: 404,
			});
		}

		// 2. Find next status (sort_order + 1)
		let nextStatus = await prisma.case_status.findFirst({
			where: {
				sort_order: currentCase.status.sort_order + 1,
				is_active: true,
			},
		});

		// Fallback: If no next step defined by sort_order, check if we should move to "DONE"
		if (!nextStatus) {
			nextStatus = await prisma.case_status.findUnique({
				where: { name: "DONE" },
			});
		}

		if (!nextStatus) {
			return new NextResponse("Next status not found", {
				status: 400,
			});
		}

		// 3. Update the procurement case status
		const updatedCase = await prisma.procurement_case.update({
			where: {
				id: id,
			},
			data: {
				status_id: nextStatus.id,
				updated_at: new Date(),
			},
		});

		// 4. Get workflow instance and step info for email (with error handling)
		try {
			const workflowInstance = await prisma.workflow_instance.findUnique({
				where: {
					ref_type_ref_id: {
						ref_type: "PROCUREMENT_CASE",
						ref_id: id,
					},
				},
				include: {
					workflow_step_instance: {
						where: {
							status: "PENDING",
						},
						include: {
							step: {
								select: {
									step_order: true,
								},
							},
						},
						orderBy: {
							created_at: "asc",
						},
						take: 1,
					},
				},
			});

			// 5. Send email notification (non-blocking)
			if (workflowInstance && workflowInstance.workflow_step_instance.length > 0) {
				const currentStepInstance = workflowInstance.workflow_step_instance[0];
				const currentStepOrder = currentStepInstance.step.step_order;
				
				console.log("📧 Triggering email for case:", id, "step order:", currentStepOrder);
				
				// Build headers object from request headers (to pass session/auth)
				const forwardHeaders: Record<string, string> = {
					"Content-Type": "application/json",
				};
				
				// Copy authentication headers (cookies, authorization, etc.)
				const authHeaders = ["cookie", "authorization", "x-csrf-token"];
				authHeaders.forEach((headerName) => {
					const value = requestHeaders.get(headerName);
					if (value) {
						forwardHeaders[headerName] = value;
					}
				});
				
				// Call email API in background with authentication headers
				fetch(`${process.env.BETTER_AUTH_URL}/api/procurement-cases/${id}/send-forward-email`, {
					method: "POST",
					headers: forwardHeaders,
					body: JSON.stringify({
						workflowInstanceId: workflowInstance.id,
						currentStepNumber: currentStepOrder - 1, // Previous step to get next step
						remarks: remarks,
					}),
				}).catch((error) => {
					console.error("❌ Failed to send email notification:", error);
				});
			} else {
				console.log("⚠️ No workflow instance or pending step found, skipping email");
			}
		} catch (emailError) {
			// Don't fail the forward if email fails
			console.error("⚠️ Email notification error (non-critical):", emailError);
		}

		return NextResponse.json(updatedCase);
	} catch (error) {
		console.error("❌ Error forwarding procurement case:", error);
		return new NextResponse(
			`Internal Server Error: ${error instanceof Error ? error.message : "Unknown error"}`,
			{ status: 500 }
		);
	}
}
