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

		// Base64 encoded logo SVG for inline embedding (ensures logo loads in all email clients)
		const logoBase64 = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiPgo8cGF0aCBkPSJNMCAwIEMtMC4xNjUgMS4xMTM3NSAtMC4zMyAyLjIyNzUgLTAuNSAzLjM3NSBDLTEuNTU5MzYyMiAxMi4zNTU4NjE2NyAtMS42OTkwNTEwNyAxOS45NTA0NDIxMSAzIDI4IEM3Ljc5NTc4OTQ1IDMzLjkwMTU1NDM4IDE0LjIzOTA1MzkgMzYuMzk3NTc2NjQgMjEuNjQ1MjYzNjcgMzcuMzM0NzE2OCBDMjIuNTE5MDA2MzUgMzcuNDEzNzUyNDQgMjMuMzkyNzQ5MDIgMzcuNDkyNzg4MDkgMjQuMjkyOTY4NzUgMzcuNTc0MjE4NzUgQzI1LjE3ODc5NjM5IDM3LjY1NjMxNTkyIDI2LjA2NDYyNDAyIDM3LjczODQxMzA5IDI2Ljk3NzI5NDkyIDM3LjgyMjk5ODA1IEMyNy45Nzg1MzM5NCAzNy45MTA2MTQwMSAyNy45Nzg1MzM5NCAzNy45MTA2MTQwMSAyOSAzOCBDMjkuMDkzODQ5MTQgNTcuOTk0NDE2NDQgMjkuMTY0MTc2NTYgNzcuOTg4Nzg3NTkgMjkuMjA3MjQ4NjkgOTcuOTgzMzc5MzYgQzI5LjIyNzc4ODEyIDEwNy4yNjkyNjgzNiAyOS4yNTU3NDE3NiAxMTYuNTU1MDE5NzIgMjkuMzAxNzU3ODEgMTI1Ljg0MDgyMDMxIEMyOS4zNDE4OTE3OCAxMzMuOTQzNTc3NjIgMjkuMzY3NDk1MjYgMTQyLjA0NjIzNTE0IDI5LjM3NjM1Mzk4IDE1MC4xNDkwODkxIEMyOS4zODE1MjQyNiAxNTQuNDMxMTMwMiAyOS4zOTM0OTEzOSAxNTguNzEyODg2MTEgMjkuNDIyOTIwMjMgMTYyLjk5NDgzNDkgQzI5LjY0ODUzNjkyIDE5Ny4xNDY1Mzc5MiAyOS42NDg1MzY5MiAxOTcuMTQ2NTM3OTIgMjUgMjE0IEMyNC41MzY5NjQ3MiAyMTUuNzUwMjE5NTcgMjQuNTM2OTY0NzIgMjE1Ljc1MDIxOTU3IDI0LjA2NDU3NTIgMjE3LjUzNTc5NzEyIEMyMy4yOTgxMjY4OCAyMjAuMzMyOTM5MyAyMi40MzM5OTM3IDIyMy4wNjcwODY4MyAyMS41IDIyNS44MTI1IEMyMS4xNjQ1MjE0OCAyMjYuODAyNTgwNTcgMjAuODI5MDQyOTcgMjI3Ljc5MjY2MTEzIDIwLjQ4MzM5ODQ0IDIyOC44MTI3NDQxNCBDMTQuMTM0NjgwMDQgMjQ2LjczOTc4ODc3IDQuNTc3ODU4MTggMjYyLjk3OTE3NTcyIC03IDI3OCBDLTcuNzY5NTcwMzEgMjc5LjAwMDMxMjUgLTguNTM5MTQwNjIgMjgwLjAwMDYyNSAtOS4zMzIwMzEyNSAyODEuMDMxMjUgQy0xOS42Njg3NDA4OSAyOTMuOTk0MDQyNjIgLTMxLjI5MzUyOTA4IDMwNi4zNDQ4ODcyNCAtNDQgMzE3IEMtNDQuODAzODkxNiAzMTcuNjc0NTgyNTIgLTQ0LjgwMzg5MTYgMzE3LjY3NDU4MjUyIC00NS42MjQwMjM0NCAzMTguMzYyNzkyOTcgQy02MC4wMDgyMzE4MyAzMzAuMzc4MTU3OTYgLTc1LjEwMzI0MDM1IDM0MS40NDEzNzE0OSAtOTAuODQ5NjA5MzggMzUxLjYwNzkxMDE2IEMtOTIuNDM1OTMxMjkgMzUyLjYzNDg0MTA4IC05NC4wMTcyMjk0OSAzNTMuNjY5NTQyMTQgLTk1LjU5NTcwMzEyIDM1NC43MDg0OTYwOSBDLTk4LjQwNjQyMTE5IDM1Ni41NTMzMzY3MyAtMTAxLjIzMjM5OTQ1IDM1OC4zNzI1NjI3OSAtMTA0LjA2MjUgMzYwLjE4NzUgQy0xMDQuOTU1NTc4NjEgMzYwLjc3NzI0NjA5IC0xMDUuODQ4NjU3MjMgMzYxLjM2Njk5MjE5IC0xMDYuNzY4Nzk4ODMgMzYxLjk3NDYwOTM4IEMtMTA3LjYxOTgyMTc4IDM2Mi41MTI3OTI5NyAtMTA4LjQ3MDg0NDczIDM2My4wNTA5NzY1NiAtMTA5LjM0NzY1NjI1IDM2My42MDU0Njg3NSBDLTExMC4xMDA1NDkzMiAzNjQuMDkxNjg3MDEgLTExMC44NTM0NDIzOCAzNjQuNTc3OTA1MjcgLTExMS42MjkxNTAzOSAzNjUuMDc4ODU3NDIgQy0xMTQuODM1NDQ0MjIgMzY2LjMyNDU5Mzg3IC0xMTYuNzA1Nzg5NyAzNjUuODk2MTk3NDcgLTEyMCAzNjUgQy0xMjIuNTM4NTc0MjIgMzYzLjc3NTg3ODkxIC0xMjIuNTM4NTc0MjIgMzYzLjc3NTg3ODkxIC0xMjUuMDU0Njg3NSAzNjIuMjI2NTYyNSBDLTEyNS45OTExMTA4NCAzNjEuNjU0NzAyMTUgLTEyNi45Mjc1MzQxOCAzNjEuMDgyODQxOCAtMTI3Ljg5MjMzMzk4IDM2MC40OTM2NTIzNCBDLTEyOC44NzY2MTM3NyAzNTkuODc2OTk3MDcgLTEyOS44NjA4OTM1NSAzNTkuMjYwMzQxOCAtMTMwLjg3NSAzNTguNjI1IEMtMTMxLjg5ODU5NjE5IDM1Ny45OTE1ODY5MSAtMTMyLjkyMjE5MjM4IDM1Ny4zNTgxNzM4MyAtMTMzLjk3NjgwNjY0IDM1Ni43MDU1NjY0MSBDLTE1NC42MTUyMDYwNiAzNDMuODQ0NDAwODcgLTE3NC42NTU3MTgzMiAzMjkuNTU3NDM2MjQgLTE5Mi42MzI4MTI1IDMxMy4xNDg0Mzc1IEMtMTk0LjcyNjIxODQ2IDMxMS4yNDg0ODE1OSAtMTk2Ljg1MTk1Njc0IDMwOS4zOTk5ODI3OSAtMTk5IDMwNy41NjI1IEMtMjA3LjU0NTUyNTM1IDMwMC4wODMwMTYwNCAtMjE0Ljk1MTQxMjI5IDI5MS44ODQ1NTg2NCAtMjIyIDI4MyBDLTIyMi42NTYxMzI4MSAyODIuMjExMDkzNzUgLTIyMy4zMTIyNjU2MyAyODEuNDIyMTg3NSAtMjIzLjk4ODI4MTI1IDI4MC42MDkzNzUgQy0yNDUuNTgwNDc2NCAyNTQuNDczNzMxOTcgLTI2MS42ODc1MjI3NyAyMjAuNTYzODM4MzIgLTI2Mi4zMTQyMDg5OCAxODYuMjUwNzMyNDIgQy0yNjIuMzM0ODY3MzQgMTg1LjI4MjE4ODg5IC0yNjIuMzU1NTI1NyAxODQuMzEzNjQ1MzYgLTI2Mi4zNzY4MTAwNyAxODMuMzE1NzUyMDMgQy0yNjIuNDQyOTYxNDkgMTgwLjA5OTkwNjYgLTI2Mi41MDE0MDA5NiAxNzYuODgzOTg1MzMgLTI2Mi41NTg1OTM3NSAxNzMuNjY3OTY4NzUgQy0yNjIuNTc5NjUxMTcgMTcyLjU1MDA3NjUgLTI2Mi42MDA3MDg1OCAxNzEuNDMyMTg0MjYgLTI2Mi42MjI0MDQxIDE3MC4yODA0MTY0OSBDLTI2My4xMDc3OTggMTQ0LjE1MjkxMTIyIC0yNjMuMTE4NjcwNTMgMTE4LjAyODAyMzM5IC0yNjMuMDY4NjY0NTUgOTEuODk2OTcyNjYgQy0yNjMuMDU4MTQzOTggODUuNzc5NjI2MTcgLTI2My4wNTM4MDc3MSA3OS42NjIyNzQ5MyAtMjYzLjA0ODgyODEyIDczLjU0NDkyMTg4IEMtMjYzLjAzODMzMzUgNjEuNjk2NjAyOTggLTI2My4wMjE0Mzg1MSA0OS44NDgzMDM4MyAtMjYzIDM4IEMtMjU5LjkwNDIyMDU2IDM2Ljk2ODA3MzUyIC0yNTcuNDM0NjQxNjUgMzYuNzk2NTQ3MTEgLTI1NC4xODc1IDM2LjYyNSBDLTI0Ni41MjE3MTA0MiAzNi4wMTU0MzExOSAtMjQyLjA3MjQ0NDQ1IDMzLjg3MzM1NjczIC0yMzcgMjggQy0yMzIuMTE2ODA2OTMgMjEuMTUwNDIwNDYgLTIzMS41OTM1NjQ1IDE0Ljg2MzI3ODA3IC0yMzIuOTM3NSA2LjU2MjUgQy0yMzMuMjI5NDcyNjYgNC43MDgxODM1OSAtMjMzLjIyOTQ3MjY2IDQuNzA4MTgzNTkgLTIzMy41MjczNDM3NSAyLjgxNjQwNjI1IEMtMjMzLjY4MzMyMDMxIDEuODg2OTkyMTkgLTIzMy44MzkyOTY4OCAwLjk1NzU3ODEyIC0yMzQgMCBDLTE3My42NTE4MjQ4NiAtMjguNzM3MjI2MjYgLTYwLjU1OTEzNDQ0IC0yOS4xNzQ0NzM1MyAwIDAgWiAiIGZpbGw9IiMwMjY1RkMiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDM2NywxMTkpIi8+CjxwYXRoIGQ9Ik0wIDAgQzAuNDk1IDAuOTkgMC40OTUgMC45OSAxIDIgQzAuNjcgMi42NiAwLjM0IDMuMzIgMCA0IEMwLjY2IDQgMS4zMiA0IDIgNCBDMi4zMyAyLjY4IDIuNjYgMS4zNiAzIDAgQzguMzA0NDUyOTggMS42NDEwOTgyMyAxMi4zMjAzMjI4OCA1LjAxMTQwNzAyIDE2LjY4NzUgOC4zMTI1IEMxOC4zODM1MjY2NiA5LjU3ODkxMjc1IDIwLjA4MDE1Njc5IDEwLjg0NDUxNzY2IDIxLjc3NzM0Mzc1IDEyLjEwOTM3NSBDMjIuNjQwODU0NDkgMTIuNzU0NTUwNzggMjMuNTA0MzY1MjMgMTMuMzk5NzI2NTYgMjQuMzk0MDQyOTcgMTQuMDY0NDUzMTIgQzI4LjQ4NDY2OTA2IDE3LjEwMjcyMjE2IDMyLjYxNTA2NjkxIDIwLjA4NDk0OTM4IDM2Ljc1IDIzLjA2MjUgQzM3LjgzODAwOTAzIDIzLjg0NzE3NjUxIDM3LjgzODAwOTAzIDIzLjg0NzE3NjUxIDM4Ljk0Nzk5ODA1IDI0LjY0NzcwNTA4IEM0My4yOTAzNjEwNCAyNy43NzY4MTI3NiA0Ny42NDI3MDcwOSAzMC44OTE3MjE2OCA1MiAzNCBDNTEuODk2ODc1IDMyLjgyNDM3NSA1MS43OTM3NSAzMS42NDg3NSA1MS42ODc1IDMwLjQzNzUgQzUxLjkzMzU5Mzc1IDI4LjIzODI4MTI1IDUxLjkzMzU5Mzc1IDI4LjIzODI4MTI1IDUzIDI2IEM1OS42OTIwMTYxNiAyMS4xNDc1ODQzNSA2Ny44MjYzNDg3OSAxNy40MDExOTczNSA3NiAxNiBDNzYgMTUuMzQgNzYgMTQuNjggNzYgMTQgQzc3LjU4MDc0NTY0IDEzLjE4MjQ3Njk3IDc5LjE2NDcxMjIzIDEyLjM3MTE4MDAzIDgwLjc1IDExLjU2MjUgQzgyLjA3MjU3ODEzIDEwLjg4MzgwODU5IDgyLjA3MjU3ODEzIDEwLjg4MzgwODU5IDgzLjQyMTg3NSAxMC4xOTE0MDYyNSBDODUuNjQxOTg1NjYgOS4xNjU0NDYwMiA4Ny42MTQ0NDYxOSA4LjQ4NDkxMzk3IDkwIDggQzkwLjI1Mzk0NTMxIDkuMDUwNTg1OTQgOTAuNTA3ODkwNjIgMTAuMTAxMTcxODcgOTAuNzY5NTMxMjUgMTEuMTgzNTkzNzUgQzkxLjExNjk5MjI3IDEyLjYwMTYxMDM1IDkxLjQ2NDY1OTY5IDE0LjAxOTU3NjM5IDkxLjgxMjUgMTUuNDM3NSBDOTEuOTc4MTQ0NTMgMTYuMTI1MjE0ODQgOTIuMTQzNzg5MDYgMTYuODEyOTI5NjkgOTIuMzE0NDUzMTIgMTcuNTIxNDg0MzggQzkyLjg0ODgwODI0IDE5LjY4OTE1MTMzIDkzLjQyMTEzMTg0IDIxLjg0Mzc5Nzk2IDk0IDI0IEM5NC4xODIyODE0OSAyNC43MTQxMjU1MiA5NC4zNjQ1NjI5OSAyNS40MjgyNTEwNCA5NC41NTIzNjgxNiAyNi4xNjQwMTY3MiBDOTYuMjU3MzQ3OTYgMzIuMDc4ODEyNTIgOTguNzA3ODE2MTcgMzUuNDgyMzE2NjMgMTAzLjE5OTIxODc1IDM5LjYwOTM3NSBDMTA0LjA5MTc5MTMxIDQwLjQ3MTQyNTQ4IDEwNC4wOTE3OTEzMSA0MC40NzE0MjU0OCAxMDUuMDAyMzk1NjMgNDEuMzUwODkxMTEgQzEwNi44ODM0NzQxNyA0My4xNjU4OTk0NSAxMDguNzgyOTQ0ODEgNDQuOTU5NjY1IDExMC42ODc1IDQ2Ljc1IEMxMTIuNjAxNjUxNTMgNDguNTU1NjAzNTIgMTE0LjUxMDUzODMyIDUwLjM2NTQyMTc5IDExNi40MDQ3MzkzOCA1Mi4xOTE5NTU1NyBDMTE3LjU3ODA0NDcxIDUzLjMyMzA0ODkyIDExOC43NjI5MjE3OCA1NC40NDIyOTE0IDExOS45NjAzNzI5MiA1NS41NDc3OTA1MyBDMTIzLjkxOTM3NDAxIDU5LjM1OTU1Mjc4IDEyMy45MTkzNzQwMSA1OS4zNTk1NTI3OCAxMjQuMzYyNTQ4ODMgNjIuODc5ODgyODEgQzEyNC4yNDI5MDc3MSA2My41Nzk1MjE0OCAxMjQuMTIzMjY2NiA2NC4yNzkxNjAxNiAxMjQgNjUgQzEyMS4xNjE0OTQwNCA2My42OTIzMDQwMiAxMTguOTUyMzc3OSA2Mi4yNjczOTY1NCAxMTYuNjI1IDYwLjE4NzUgQzExNS45NDY5NTMxMiA1OS41ODE2NDA2MiAxMTUuMjY4OTA2MjUgNTguOTc1NzgxMjUgMTE0LjU3MDMxMjUgNTguMzUxNTYyNSBDMTA5LjAxNDgxMDI3IDUzLjI2ODg2ODk3IDEwMy41MDI4NDAyNiA0OC4xMzk1OTA5OCA5OCA0MyBDOTkuMDk2ODYzMDEgNTguODc4NTA5NjYgOTkuMDk2ODYzMDEgNTguODc4NTA5NjYgMTA2LjY3MTg3NSA3Mi4xMDkzNzUgQzExMC4yMjIwMDAxNSA3NC44NTc0ODk3OCAxMTMuOTc2NzM3NTUgNzcuMDIxMjYzMzcgMTE4IDc5IEMxMTMuNjU5MzM1MTYgMTA5LjIwODY4MSA4MC44ODIyMzU5MiAxNDAuNDg2MzU0MzMgNTguMDAzOTA2MjUgMTU4LjYxMzI4MTI1IEM1NS44MTM2MTQzNSAxNjAuMzUzNTUyMTkgNTMuNjYzNzAxNzQgMTYyLjExNDA0OTc2IDUxLjUyNzM0Mzc1IDE2My45MTc5Njg3NSBDNDEuMzY2MDI4NTUgMTcyLjQ0MTgwOTMyIDMwLjYzMzA0OTMyIDE3OS45MTkyMTA1MyAxOS41OTQyMzgyOCAxODcuMjU5Mjc3MzQgQzE3LjE3NjY4MiAxODguODgxNDQ3MTQgMTQuNzg1NjUxODcgMTkwLjUzNTA5NTc1IDEyLjQwMjM0Mzc1IDE5Mi4yMDcwMzEyNSBDMTEuNzE0NzA5NDcgMTkyLjY4Mzc0MjY4IDExLjAyNzA3NTIgMTkzLjE2MDQ1NDEgMTAuMzE4NjAzNTIgMTkzLjY1MTYxMTMzIEM5LjA2MTM5Mjk5IDE5NC41MjM4MTAwMSA3LjgxMDEwMjE0IDE5NS40MDQ2MzEyNSA2LjU2NjE2MjExIDE5Ni4yOTU2NTQzIEMyLjYyMTc1MjQ3IDE5OC45OTYyODQzNSAyLjYyMTc1MjQ3IDE5OC45OTYyODQzNSAwLjAzOTA2MjUgMTk5LjAxMTcxODc1IEMtMy4wOTIzMzIxNiAxOTcuNDU4MDE5MSAtNi4wNTMzOTczIDE5NS42ODUzOTMxNSAtOSAxOTMuODEyNSBDLTkuNjkxMzQwMzMgMTkzLjM3NjE1MjM0IC0xMC4zODI2ODA2NiAxOTIuOTM5ODA0NjkgLTExLjA5NDk3MDcgMTkyLjQ5MDIzNDM4IEMtMjQuODczMzg3NDcgMTgzLjY5NDAwNzcxIC0zOC4yMTA3MTI3NyAxNzQuMTc5MjI4NjEgLTUxIDE2NCBDLTUxLjkxNjUyMzQ0IDE2My4yNzY4MzU5NCAtNTIuODMzMDQ2ODcgMTYyLjU1MzY3MTg3IC01My43NzczNDM3NSAxNjEuODA4NTkzNzUgQy03Ny4xMTg2NjAzNyAxNDMuMDg4NjU2ODkgLTk2LjgxMzgxMzY4IDEyMS41MTUyMDAyMiAtMTExLjYyNSA5NS40Mzc1IEMtMTEyLjA1MDk1NDU5IDk0LjcwMDA3NTY4IC0xMTIuNDc2OTA5MTggOTMuOTYyNjUxMzcgLTExMi45MTU3NzE0OCA5My4yMDI4ODA4NiBDLTExNS4zMDIyMTIyNSA4OC44ODc0MzczMyAtMTE3LjM0Nzg5MjA2IDg1LjA0NzM4MzExIC0xMTcgODAgQy0xMTQuOTA2NjI2OTcgNzcuNTM1MjA5NDggLTExMi4zNjM0MDk4MSA3NS44NTA0NjEzOCAtMTA5LjY4NzUgNzQuMDYyNSBDLTEwMy43MzY0MTY1OSA3MC4yMzAyOTc3MyAtMTAzLjczNjQxNjU5IDcwLjIzMDI5NzczIC0xMDAuNjIxMDkzNzUgNjQuMTUyMzQzNzUgQy0xMDAuMzg5NzA4NjkgNjIuNzcyMDkxNTcgLTEwMC4xODMxMTg0NyA2MS4zODc0ODA3MiAtMTAwIDYwIEMtOTkuNzIxNzM5ODMgNTguNTcxODE1MzggLTk5LjQzNzg1MTAzIDU3LjE0NDcxNjI4IC05OS4xNDg0Mzc1IDU1LjcxODc1IEMtOTguODg4MTA2NzYgNTQuMzEyOTY0MDEgLTk4LjYzMDI5MTc4IDUyLjkwNjcwOTggLTk4LjM3NSA1MS41IEMtOTguMjQwOTM3NSA1MC43NzI5Njg3NSAtOTguMTA2ODc1IDUwLjA0NTkzNzUgLTk3Ljk2ODc1IDQ5LjI5Njg3NSBDLTk3LjY0MzU3OTUgNDcuNTMxNjYzNjkgLTk3LjMyMTQ2MDY4IDQ1Ljc2NTg5MDY3IC05NyA0NCBDLTU1LjQ4NDY4NzUgNDQuNDk2Mjg5MDYgLTU1Ljk2OTM3NSA0NC45OTI1NzgxMiAtNTYuNDY4NzUgNDUuNTAzOTA2MjUgQy02MC41NDE1NDU3MyA0OS42MzE1MjgwOCAtNjQuNzA1NDA5MjIgNTMuNTUzMTA2MzIgLTY5LjEwOTM3NSA1Ny4zMjQyMTg3NSBDLTcwLjk1Mjc4NTYgNTguOTU4MTUwODcgLTcyLjY2NTE2MTYyIDYwLjY2NTQxMDIyIC03NC4zNzUgNjIuNDM3NSBDLTc3IDY1IC03NyA2NSAtNzkgNjUgQy03OSA2NS42NiAtNzkgNjYuMzIgLTc5IDY3IEMtNzkuNjYgNjcgLTgwLjMyIDY3IC04MSA2NyBDLTgxLjM0OTczNjMxIDYyLjUzOTQyODY4IC04MS4zNDk3MzYzMSA2Mi41Mzk0Mjg2OCAtNzkuODEzNDc2NTYgNjAuMTY5OTIxODggQy03OS4yNjE0MzU1NSA1OS42MDg1MzUxNiAtNzguNzA5Mzk0NTMgNTkuMDQ3MTQ4NDQgLTc4LjE0MDYyNSA1OC40Njg3NSBDLT3Ny4yMTY3Mjk3NCA1Ny41MDkzMjQ5NSAtNzcuMjE2NzI5NzQgNTcuNTA5MzI0OTUgLTc2LjI3NDE2OTkyIDU2LjUzMDUxNzU4IEMtNzUuNjA2MTkzODUgNTUuODYwNDQ2NzggLTc0LjkzODIxNzc3IDU1LjE5MDM3NTk4IC03NC4yNSA1NC41IEMtNzIuODc1OTkwNTEgNTMuMDc3MTIzNzIgLTcxLjUwMjI5NzE0IDUxLjY1Mzk0MjEyIC03MC4xMjg5MDYyNSA1MC4yMzA0Njg3NSBDLTY5LjQzNjg0MDgyIDQ5LjUyMTk2Nzc3IC02OC43NDQ3NzUzOSA0OC44MTM0NjY4IC02OC4wMzE3MzgyOCA0OC4wODM0OTYwOSBDLTY1LjA0OTE5Nzc1IDQ1LjAyNDk3NjQgLTYyLjEwODk5MjUgNDEuOTI5MjQ1MjggLTU5LjE4NzUgMzguODEyNSBDLTU4LjY5MDg4ODY3IDM4LjI5Njg3NSAtNTguMTk0Mjc3MzQgMzcuNzgxMjUgLTU3LjY4MjYxNzE5IDM3LjI1IEMtNTEuOTMyMjUyNjEgMzEuMTIzODIxMDEgLTUxLjA4ODczOTk0IDI0LjIxMDcxMTI3IC00OS41IDE2LjI0MjE4NzUgQy00OS4wNjA1Mjk5NCAxNC4xNDc4Mzc5OCAtNDguNTM2NzU4MjEgMTIuMDcxNTUxMjMgLTQ4IDEwIEMtNDcuMzQgOS42NyAtNDYuNjggOS4zNCAtNDYgOSBDLTQ0LjE3NzAxMjQ1IDkuODk0Mjk1NzggLTQyLjM1ODQyMDQgMTAuNzk4NjEzNjggLTQwLjU2MjUgMTEuNzQ2MDkzNzUgQy0zNC42MDk0OTY2OSAxNC42NTkwNzI1IC0yOC4yODM3ODc1MiAxNi45MDU0MDQxNiAtMjIgMTkgQy0yMiAxOS42NiAtMjIgMjAuMzIgLTIyIDIxIEMtMjEuNDI3NjU2MjUgMjEuMTMyNzczNDQgLTIwLjg1NTMxMjUgMjEuMjY1NTQ2ODcgLTIwLjI2NTYyNSAyMS40MDIzNDM3NSBDLTE4LjAyMzQ5MTI1IDIxLjk5MzgwMzE3IC0xNS45MTQyMDM4MSAyMi43MzI4ODg1NCAtMTMuNzUgMjMuNTYyNSBDLTEyLjUxMjUgMjQuMDM2ODc1IC0xMS4yNzUgMjQuNTExMjUgLTEwIDI1IEMtMTAgMjguNjMgLTEwIDMyLjI2IC0xMCAzNiBDLTIuMTMxNTcyMjYgMzAuNDI5MjA0NSA1LjY4MDAxMjk3IDI0Ljc4NjkyMDEzIDEzLjQzNzUgMTkuMDYyNSBDMTQuMjM4NDkxMjEgMTguNDcyMzUxMDcgMTUuMDM5NDgyNDIgMTcuODgyMjAyMTUgMTUuODY0NzQ2MDkgMTcuMjc0MTY5OTIgQzE5LjcyMjk2NzgyIDE0LjQyOTAzMzQ5IDIzLjU3Mjg1NTQyIDExLjU3MzgyNDQzIDI3LjQwNjI1IDguNjk1MzEyNSBDMjguMDg4ODg5MTYgOC4xODYwNTIyNSAyOC43NzE1MjgzMiA3LjY3Njc5MTk5IDI5LjQ3NDg1MzUyIDcuMTUyMDk5NjEgQzMwLjc0NzQ4ODgzIDYuMjAyNDExOTMgMzIuMDE2NDU2MzUgNS4yNDc3ODE0NyAzMy4yODEwMDU4NiA0LjI4NzM1MzUyIEMzNi4xMDEzODU2NiAyLjE4OTYzMzMxIDM4LjQ1NzU2NTczIDAuNDYxMjk5NzkgNDIgMCBaICIgZmlsbD0iIzIzMzM3NSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMjUwLDI2NykiLz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgd2lkdGg9IjUwMCIgaGVpZ2h0PSI1MDAiPjwvc3ZnPgo=';
		
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
				<img src="${logoBase64}" alt="Logo Kementerian Perhubungan - Biro Umum" style="height: 60px; width: auto; display: block;" />
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
