import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { refreshMicrosoftToken } from "@/lib/ms-token";
import {
	sendWorkflowEmails,
	getNextApproversForWorkflow,
	getCCForProcurementCase,
} from "@/lib/workflow/email-helpers";

/**
 * API endpoint to send email notification when forwarding a procurement case
 * Email will be sent FROM the logged-in user using their Microsoft account token
 * POST /api/procurement-cases/[id]/send-forward-email
 */
export async function POST(request, { params }) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { workflowInstanceId, currentStepNumber, remarks } = body;

		// Validate required fields
		if (!id || !workflowInstanceId || currentStepNumber === undefined) {
			return NextResponse.json(
				{
					error: "Missing required fields: id, workflowInstanceId, currentStepNumber",
				},
				{ status: 400 }
			);
		}

		// Get current session to get user's Microsoft access token
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json(
				{ error: "Unauthorized - please login" },
				{ status: 401 }
			);
		}

		// Get user's Microsoft account token (delegated auth)
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
			select: {
				id: true,
				accessToken: true,
				accessTokenExpiresAt: true,
				refreshToken: true,
			},
		});

		if (!account?.accessToken) {
			console.error("❌ No Microsoft access token found for user:", session.user.email);
			return NextResponse.json({
				success: false,
				error: "User not authenticated with Microsoft. Please login with Microsoft account to send emails.",
			}, { status: 403 });
		}

		// Check if token is expired and refresh if needed
		let accessToken = account.accessToken;
		const isExpired = account.accessTokenExpiresAt
			? new Date(account.accessTokenExpiresAt).getTime() - 5 * 60 * 1000 < Date.now()
			: true;

		if (isExpired && account.refreshToken) {
			console.log("🔄 Access token expired, refreshing...");
			const newToken = await refreshMicrosoftToken(account);
			if (!newToken) {
				console.error("❌ Failed to refresh token");
				return NextResponse.json({
					success: false,
					error: "Session expired. Please logout and login again with Microsoft account.",
				}, { status: 401 });
			}
			accessToken = newToken;
		}

		console.log(`📧 Processing email for case ${id}, step ${currentStepNumber}, sender: ${session.user.email}`);

		// Get current procurement case details
		const procurementCase = await prisma.procurement_case.findUnique({
			where: { id: id },
			select: {
				id: true,
				case_code: true,
				title: true,
				created_at: true,
				status: {
					select: {
						name: true,
					},
				},
				created_by: true,
				unit: {
					select: {
						unit_name: true,
					},
				},
			},
		});

		if (!procurementCase) {
			return NextResponse.json(
				{ error: "Procurement case not found" },
				{ status: 404 }
			);
		}

		// Get workflow instance
		const workflowInstance = await prisma.workflow_instance.findUnique({
			where: { id: workflowInstanceId },
			select: {
				id: true,
				workflow_id: true,
			},
		});

		if (!workflowInstance) {
			return NextResponse.json(
				{ error: "Workflow instance not found" },
				{ status: 404 }
			);
		}

		// Get next approvers
		const nextApprovers = await getNextApproversForWorkflow(
			workflowInstanceId,
			currentStepNumber
		);

		if (nextApprovers.length === 0) {
			console.log("⚠️ No next approver found, skipping email notification");
			return NextResponse.json({
				success: true,
				message: "No next approver found, email not sent",
				emailSent: false,
			});
		}

		// Get CC recipients
		const ccRecipients = await getCCForProcurementCase(id);

		// Get requester name
		let requesterName = "N/A";
		if (procurementCase.created_by) {
			const requester = await prisma.user.findUnique({
				where: { id: procurementCase.created_by },
				select: { name: true },
			});
			requesterName = requester?.name || procurementCase.created_by;
		}

		// Prepare email content
		const nextStepTitle = nextApprovers[0].title;
		const subject = `Procurement Request #${procurementCase.case_code} - Action Required`;

		const text = `
Dear ${nextStepTitle},

A procurement request has been forwarded to you for approval.

Request Details:
- Case Number: ${procurementCase.case_code}
- Title: ${procurementCase.title}
- Requester: ${requesterName}
- Date Created: ${new Date(procurementCase.created_at).toLocaleDateString("id-ID")}
- Status: ${procurementCase.status?.name || "N/A"}

${remarks ? `Remarks: ${remarks}` : ""}

Please review and take action on this request.

View Request: ${process.env.BETTER_AUTH_URL}/pengadaan/${id}

Best regards,
Procurement System
		`.trim();

		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<style>
		body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; }
		.container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
		.header { background: linear-gradient(135deg, #f9f9f9, #f9f9f9); color: #0078d4; padding: 30px 20px; text-align: center; }
		.logo-section { display: flex; align-items: center; justify-content: center; gap: 15px; margin-bottom: 15px; background: rgba(255, 255, 255, 0.15); padding: 15px 20px; border-radius: 8px; backdrop-filter: blur(10px); }
		.logo-section img { height: 50px; width: auto; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2)); }
		.logo-section h1 { margin: 0; font-size: 22px; font-weight: 600; color: #0078d4; text-shadow: none; }
		.header h2 { color: #0078d4; font-size: 18px; margin-bottom: 5px; margin-top: 15px; text-shadow: 2px 2px 4px rgba(0,0,0,0.2); }
		.header p { text-shadow: 1px 1px 2px rgba(12, 12, 12, 0.93); font-size: 14px; }
		.content { padding: 30px; }
		.details { background: #f9f9f9; padding: 20px; margin: 20px 0; border-left: 4px solid #0078d4; border-radius: 4px; }
		.details h3 { color: #0078d4; font-size: 16px; margin-bottom: 15px; }
		.detail-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
		.detail-row:last-child { border-bottom: none; }
		.detail-label { font-weight: 600; width: 120px; color: #555; }
		.detail-value { color: #333; }
		.remarks { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
		.button { display: inline-block; padding: 12px 30px; background: #0078d4; color: white !important; text-decoration: none; border-radius: 5px; margin: 20px 0; }
		.footer { background: #f9f9f9; text-align: center; padding: 20px; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0; }
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo-section">
				<img src="${process.env.BETTER_AUTH_URL}/kemenhub-biro-umum.svg" alt="Logo Kemenhub">
				<h1>Procurement Management System</h1>
			</div>
			<h2>Procurement Request Forwarded</h2>
			<p>Action Required</p>
		</div>
		<div class="content">
			<p>Dear <strong>${nextStepTitle}</strong>,</p>
			<p>A procurement request has been forwarded to you for approval.</p>
			
			<div class="details">
				<h3>📋 Request Information</h3>
				<div class="detail-row">
					<div class="detail-label">Request No:</div>
					<div class="detail-value"><strong>${procurementCase.case_code}</strong></div>
				</div>
				<div class="detail-row">
					<div class="detail-label">Title:</div>
					<div class="detail-value">${procurementCase.title}</div>
				</div>
				<div class="detail-row">
					<div class="detail-label">Requester:</div>
					<div class="detail-value">${requesterName}</div>
				</div>
				<div class="detail-row">
					<div class="detail-label">Submitted:</div>
					<div class="detail-value">${new Date(procurementCase.created_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
				</div>
				<div class="detail-row">
					<div class="detail-label">Status:</div>
					<div class="detail-value">${procurementCase.status?.name || "N/A"}</div>
				</div>
			</div>
			
			${remarks ? `
			<div class="remarks">
				<strong>💬 Remarks:</strong><br>
				${remarks}
			</div>
			` : ""}
			
			<p>Please review this request and take appropriate action.</p>
			
			<center>
				<a href="${process.env.BETTER_AUTH_URL}/pengadaan/${id}" class="button">
					View Request Details →
				</a>
			</center>
		</div>
		<div class="footer">
			<p><strong>Procurement Management System</strong></p>
			<p>This is an automated notification. Please do not reply to this email.</p>
		</div>
	</div>
</body>
</html>
		`.trim();

		// Send emails using logged-in user's token (delegated auth)
		console.log(`📤 Sending emails to ${nextApprovers.length} approver(s) from ${session.user.email}...`);
		const emailResults = await sendWorkflowEmails(
			nextApprovers,
			subject,
			text,
			html,
			accessToken,
			ccRecipients
		);

		const successCount = emailResults.filter((r) => r.success).length;
		console.log(`✅ Email notification complete: ${successCount}/${nextApprovers.length} sent successfully`);

		return NextResponse.json({
			success: true,
			message: `Email sent successfully to ${successCount}/${nextApprovers.length} recipient(s)`,
			emailSent: true,
			emailResults,
			recipients: nextApprovers.map((a) => ({
				email: a.email,
				title: a.title,
			})),
		});
	} catch (error) {
		console.error("❌ Error sending forward email:", error);
		return NextResponse.json(
			{
				success: false,
				error: error.message || "Failed to send email",
			},
			{ status: 500 }
		);
	}
}
