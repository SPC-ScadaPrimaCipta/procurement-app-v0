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

		// Logo URL hosted on Cloudinary (reliable loading across all email clients)
		const logoURL = 'https://res.cloudinary.com/dyowppfu2/image/upload/v1769587580/Frame_77-Photoroom_qfryy2.png';
		
		const html = `
<!DOCTYPE html>
<html lang="id">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		* { margin: 0; padding: 0; box-sizing: border-box; }
		body { 
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
			line-height: 1.6; 
			color: #333; 
			background-color: #f5f7fa; 
			padding: 20px;
		}
		.email-wrapper { 
			max-width: 650px; 
			margin: 0 auto; 
			background: #ffffff; 
			border-radius: 10px; 
			overflow: hidden; 
			box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08); 
		}
		.header { 
			background-color: #1e3a8a; 
			padding: 40px 30px; 
			text-align: center; 
		}
		.logo-container { 
			background: rgba(255, 255, 255, 0.95); 
			padding: 20px; 
			border-radius: 10px; 
			margin-bottom: 20px; 
			display: inline-block;
			box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
		}
		.logo-container img { 
			height: 60px; 
			width: auto; 
			display: block;
		}
		.header-title { 
			color: #ffffff; 
			font-size: 24px; 
			font-weight: 700; 
			margin: 15px 0 8px 0; 
			text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		}
		.header-subtitle { 
			color: #e0e7ff; 
			font-size: 14px; 
			font-weight: 500;
			letter-spacing: 0.5px;
		}
		.badge { 
			display: inline-block; 
			background: #ef4444; 
			color: white; 
			padding: 6px 16px; 
			border-radius: 20px; 
			font-size: 12px; 
			font-weight: 600; 
			margin-top: 10px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		.content { 
			padding: 40px 30px; 
		}
		.greeting { 
			font-size: 16px; 
			color: #1e293b; 
			margin-bottom: 20px; 
		}
		.greeting strong { 
			color: #1e3a8a; 
		}
		.intro-text { 
			color: #475569; 
			margin-bottom: 30px; 
			font-size: 15px; 
		}
		.details-card { 
			background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%); 
			padding: 25px; 
			margin: 25px 0; 
			border-left: 5px solid #3b82f6; 
			border-radius: 8px; 
			box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
		}
		.details-title { 
			color: #1e3a8a; 
			font-size: 18px; 
			font-weight: 700; 
			margin-bottom: 20px; 
			display: flex; 
			align-items: center; 
			gap: 8px;
		}
		.detail-item { 
			display: grid; 
			grid-template-columns: 140px 1fr; 
			padding: 12px 0; 
			border-bottom: 1px solid #e2e8f0; 
			gap: 15px;
		}
		.detail-item:last-child { 
			border-bottom: none; 
		}
		.detail-label { 
			font-weight: 600; 
			color: #475569; 
			font-size: 14px;
		}
		.detail-value { 
			color: #1e293b; 
			font-size: 14px;
		}
		.detail-value strong { 
			color: #1e3a8a; 
			font-size: 16px;
		}
		.remarks-box { 
			background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
			border-left: 5px solid #f59e0b; 
			padding: 20px; 
			margin: 25px 0; 
			border-radius: 8px;
			box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
		}
		.remarks-title { 
			font-weight: 700; 
			color: #92400e; 
			margin-bottom: 10px; 
			font-size: 15px;
			display: flex; 
			align-items: center; 
			gap: 6px;
		}
		.remarks-text { 
			color: #78350f; 
			font-style: italic; 
			line-height: 1.7;
		}
		.action-section { 
			text-align: center; 
			padding: 30px 0; 
		}
		.action-text { 
			color: #475569; 
			margin-bottom: 20px; 
			font-size: 15px;
		}
		.btn-primary { 
			display: inline-block; 
			background-color: #3b82f6; 
			color: #ffffff; 
			text-decoration: none; 
			padding: 14px 40px; 
			border-radius: 8px; 
			font-weight: 600; 
			font-size: 15px;
			mso-padding-alt: 14px 40px;
		}
		.footer { 
			background: #f8fafc; 
			text-align: center; 
			padding: 30px; 
			color: #64748b; 
			font-size: 13px; 
			border-top: 2px solid #e2e8f0; 
		}
		.footer-title { 
			font-weight: 700; 
			color: #1e3a8a; 
			margin-bottom: 8px; 
			font-size: 14px;
		}
		.footer-note { 
			color: #94a3b8; 
			margin-top: 5px;
		}
		.divider { 
			height: 1px; 
			background: linear-gradient(to right, transparent, #cbd5e1, transparent); 
			margin: 20px 0; 
		}
		@media only screen and (max-width: 600px) {
			.email-wrapper { 
				border-radius: 0; 
			}
			.content { 
				padding: 30px 20px; 
			}
			.detail-item { 
				grid-template-columns: 1fr; 
				gap: 5px; 
			}
		}
	</style>
</head>
<body>
	<div class="email-wrapper">
		<div class="header" style="background-color: #1e3a8a; padding: 40px 30px; text-align: center;">
			<div class="logo-container" style="background: rgba(255, 255, 255, 0.95); padding: 20px; border-radius: 10px; margin-bottom: 20px; display: inline-block; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
				<img src="${logoURL}" alt="Logo Kementerian Perhubungan - Biro Umum" style="height: 60px; width: auto; display: block;" />
			</div>
			<h1 class="header-title" style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">Sistem Manajemen Pengadaan</h1>
			<p class="header-subtitle" style="margin: 8px 0 0 0; color: #dbeafe; font-size: 14px;">Kementerian Perhubungan - Biro Umum</p>
			<div class="badge" style="display: inline-block; background: #fef3c7; color: #78350f; padding: 8px 20px; border-radius: 20px; margin-top: 15px; font-weight: 600; font-size: 13px; border: 2px solid #fbbf24;">⚡ Tindakan Diperlukan</div>
		</div>
		
		<div class="content">
			<p class="greeting">Yth. <strong>${nextStepTitle}</strong>,</p>
			
			<p class="intro-text">
				Sebuah permohonan pengadaan telah diteruskan kepada Anda untuk ditinjau dan disetujui. 
				Mohon untuk segera menindaklanjuti permohonan ini.
			</p>
			
			<div class="details-card">
				<div class="details-title">
					<span>📋</span>
					<span>Informasi Permohonan</span>
				</div>
				
				<div class="detail-item">
					<div class="detail-label">Nomor Kasus:</div>
					<div class="detail-value"><strong>${procurementCase.case_code}</strong></div>
				</div>
				
				<div class="detail-item">
					<div class="detail-label">Judul:</div>
					<div class="detail-value">${procurementCase.title}</div>
				</div>
				
				<div class="detail-item">
					<div class="detail-label">Pemohon:</div>
					<div class="detail-value">${requesterName}</div>
				</div>
				
				<div class="detail-item">
					<div class="detail-label">Tanggal Diajukan:</div>
					<div class="detail-value">${new Date(procurementCase.created_at).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
				</div>
				
				<div class="detail-item">
					<div class="detail-label">Status Saat Ini:</div>
					<div class="detail-value">${procurementCase.status?.name || "N/A"}</div>
				</div>
			</div>
			
			${remarks ? `
			<div class="remarks-box">
				<div class="remarks-title">
					<span>💬</span>
					<span>Catatan dari Pengirim:</span>
				</div>
				<div class="remarks-text">${remarks}</div>
			</div>
			` : ""}
			
			<div class="divider"></div>
			
			<div class="action-section">
				<p class="action-text">
					Silakan klik tombol di bawah ini untuk melihat detail lengkap dan mengambil tindakan yang diperlukan.
				</p>
				<a href="${process.env.BETTER_AUTH_URL}/pengadaan/${id}" class="btn-primary" style="background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
					📄 Lihat Detail Permohonan
				</a>
			</div>
		</div>
		
		<div class="footer">
			<p class="footer-title">Sistem Manajemen Pengadaan</p>
			<p>Kementerian Perhubungan - Biro Umum</p>
			<p class="footer-note">Email ini dikirim secara otomatis. Mohon tidak membalas email ini.</p>
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
