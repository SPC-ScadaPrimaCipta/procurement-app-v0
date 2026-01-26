import prisma from "@/lib/prisma";

/**
 * Send an email using Microsoft Graph API with delegated auth (on behalf of logged-in user)
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body (optional)
 * @param {string} [options.accessToken] - User's Microsoft Graph access token (delegated)
 * @param {Array} [options.cc] - CC recipients (optional)
 */
export async function sendEmail({
	to,
	subject,
	text,
	html,
	accessToken,
	cc = [],
}) {
	if (accessToken) {
		try {
			const message = {
				message: {
					subject: subject,
					body: {
						contentType: html ? "HTML" : "Text",
						content: html || text,
					},
					toRecipients: [
						{
							emailAddress: {
								address: to,
							},
						},
					],
					...(cc && cc.length > 0
						? {
								ccRecipients: cc.map((c) => ({
									emailAddress: {
										address:
											typeof c === "string" ? c : c.email,
									},
								})),
						  }
						: {}),
				},
			};

			// Use /me/sendMail endpoint with user's delegated token
			const response = await fetch(
				`https://graph.microsoft.com/v1.0/me/sendMail`,
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify(message),
				}
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.log(
					`Graph API failed (${response.status}): ${errorText}`
				);
				throw new Error(
					`Graph API error: ${response.status} - ${errorText}`
				);
			}

			console.log(`✅ Email sent via Graph API to: ${to}`);
			return { success: true };
		} catch (error) {
			console.error("❌ Graph API email error:", error);
			return { success: false, error: error.message };
		}
	} else {
		return { success: false, message: "No access token found" };
	}
}

/**
 * Send workflow notification emails to multiple recipients
 * @param {Array} approvers - Array of approver objects with email and title
 * @param {string} subject - Email subject
 * @param {string} text - Email text content
 * @param {string} [html] - Email HTML content (optional)
 * @param {string} [accessToken] - Microsoft Graph access token (optional)
 * @param {Array} [cc] - CC recipients (optional)
 * @returns {Array} - Array of results for each email sent
 */
export async function sendWorkflowEmails(
	approvers,
	subject,
	text,
	html = null,
	accessToken = null,
	cc = [],
) {
	const results = [];

	for (const approver of approvers) {
		try {
			const { success, message } = await sendEmail({
				to: approver.email,
				subject,
				text,
				html,
				accessToken,
				cc,
			});
			if (success) {
				console.log(`✅ Email sent successfully to: ${approver.email}`);
				results.push({ email: approver.email, success: true });
			} else {
				results.push({
					email: approver.email,
					success: false,
					message: message,
				});
			}
		} catch (error) {
			console.error(`❌ Failed to send email to ${approver.email}:`, error);
			results.push({
				email: approver.email,
				success: false,
				error: error.message,
			});
		}
	}

	return results;
}

/**
 * Get next approver's emails based on workflow step instance
 * @param {string} workflowInstanceId - The workflow instance ID
 * @param {number} currentStepNumber - Current step number (to get next step)
 * @returns {Promise<Array>} Array of objects with email and title
 */
export async function getNextApproversForWorkflow(
	workflowInstanceId,
	currentStepNumber
) {
	try {
		// Get workflow instance
		const workflowInstance = await prisma.workflow_instance.findUnique({
			where: { id: workflowInstanceId },
			include: {
				workflow: true,
			},
		});

		if (!workflowInstance) {
			console.log("❌ Workflow instance not found:", workflowInstanceId);
			return [];
		}

		// Get next workflow step (step_order = currentStepNumber + 1)
		const nextStep = await prisma.workflow_step.findFirst({
			where: {
				workflow_id: workflowInstance.workflow_id,
				step_order: currentStepNumber + 1,
			},
			select: {
				id: true,
				name: true,
				approver_strategy: true,
				approver_value: true,
			},
		});

		if (!nextStep) {
			console.log(
				"⚠️ No next step found for step order:",
				currentStepNumber + 1
			);
			return [];
		}

		// Get step instance to find who is assigned
		const stepInstance = await prisma.workflow_step_instance.findFirst({
			where: {
				workflow_instance_id: workflowInstanceId,
				step_id: nextStep.id,
			},
			select: {
				assigned_to: true,
			},
		});

		if (!stepInstance) {
			console.log("⚠️ Step instance not found for step:", nextStep.id);
			return [];
		}

		// Parse assigned_to (it's a JSON array of user IDs)
		let assignedUserIds = [];
		try {
			if (typeof stepInstance.assigned_to === "string") {
				assignedUserIds = JSON.parse(stepInstance.assigned_to);
			} else if (Array.isArray(stepInstance.assigned_to)) {
				assignedUserIds = stepInstance.assigned_to;
			}
		} catch (e) {
			console.error("Error parsing assigned_to:", e);
			return [];
		}

		if (assignedUserIds.length === 0) {
			console.log("⚠️ No assigned users found in step instance");
			return [];
		}

		console.log(`📋 Found ${assignedUserIds.length} assigned user(s):`, assignedUserIds);

		// Get user emails from the user table
		const users = await prisma.user.findMany({
			where: {
				id: {
					in: assignedUserIds,
				},
			},
			select: {
				id: true,
				email: true,
			},
		});

		if (users.length === 0) {
			console.log("⚠️ No users found for assigned IDs");
			return [];
		}

		// Map to email and title format
		const approvers = users
			.filter((user) => user.email)
			.map((user) => ({
				email: user.email,
				title: nextStep.name, // Use step name as title
			}));

		console.log(`✅ Found ${approvers.length} approver(s) for next step`);
		return approvers;
	} catch (error) {
		console.error("❌ Error getting next approvers:", error);
		return [];
	}
}

/**
 * Get CC recipients for a procurement case
 * @param {string} caseId - The procurement case ID
 * @returns {Promise<Array>} Array of email objects
 */
export async function getCCForProcurementCase(caseId) {
	try {
		// This is placeholder - adjust based on your CC logic
		// You might have CC stored in case metadata or disposition
		const caseData = await prisma.procurement_case.findUnique({
			where: { id: caseId },
			select: {
				case_disposition_summary: {
					select: {
						forward_to: {
							select: {
								recipient: {
									select: {
										email: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (
			!caseData?.case_disposition_summary?.forward_to ||
			caseData.case_disposition_summary.forward_to.length === 0
		) {
			return [];
		}

		const ccEmails = caseData.case_disposition_summary.forward_to
			.map((ft) => ft.recipient?.email)
			.filter((email) => email);

		return ccEmails.map((email) => ({ email }));
	} catch (error) {
		console.error("❌ Error getting CC recipients:", error);
		return [];
	}
}
