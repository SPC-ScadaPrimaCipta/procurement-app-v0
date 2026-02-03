import prisma from "@/lib/prisma";
import { refreshMicrosoftToken } from "@/lib/ms-token";

/**
 * Get access token for system email account
 * Uses Application-level authentication (client credentials flow)
 * Requires: MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET
 */
async function getSystemAccessToken() {
	const tenantId = process.env.MICROSOFT_TENANT_ID;
	const clientId = process.env.MICROSOFT_CLIENT_ID;
	const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;

	if (!tenantId || !clientId || !clientSecret) {
		console.log("⚠️ System account credentials not configured, will use fallback");
		return null;
	}

	try {
		const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

		const params = new URLSearchParams({
			client_id: clientId,
			client_secret: clientSecret,
			scope: "https://graph.microsoft.com/.default",
			grant_type: "client_credentials",
		});

		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: params,
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`❌ Failed to get system token: ${response.status} - ${errorText}`);
			return null;
		}

		const data = await response.json();
		console.log("✅ System access token obtained successfully");
		return data.access_token;
	} catch (error) {
		console.error("❌ Error getting system access token:", error);
		return null;
	}
}

/**
 * Get fallback access token from first available Microsoft account
 * Used when system account is not configured
 */
async function getFallbackAccessToken() {
	try {
		const account = await prisma.account.findFirst({
			where: {
				providerId: "microsoft",
				accessToken: { not: null },
			},
			select: {
				id: true,
				accessToken: true,
				accessTokenExpiresAt: true,
				refreshToken: true,
			},
			orderBy: {
				createdAt: "asc",
			},
		});

		if (!account?.accessToken) {
			console.error("❌ No fallback Microsoft account found");
			return null;
		}

		// Check if token is expired and refresh if needed
		let accessToken = account.accessToken;
		const isExpired = account.accessTokenExpiresAt
			? new Date(account.accessTokenExpiresAt).getTime() - 5 * 60 * 1000 < Date.now()
			: true;

		if (isExpired && account.refreshToken) {
			console.log("🔄 Fallback token expired, refreshing...");
			const newToken = await refreshMicrosoftToken(account);
			if (!newToken) {
				console.error("❌ Failed to refresh fallback token");
				return null;
			}
			accessToken = newToken;
		}

		console.log("✅ Using fallback account token");
		return { token: accessToken, isFallback: true };
	} catch (error) {
		console.error("❌ Error getting fallback token:", error);
		return null;
	}
}

/**
 * Send email using system account (or fallback to user account)
 * @param {Object} options - Email options
 * @param {Array<string>} options.to - Recipient email addresses
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - HTML body
 * @param {Array<string>} [options.cc] - CC email addresses
 * @param {string} [options.replyTo] - Reply-to email address
 * @returns {Promise<{success: boolean, error?: string, usedFallback?: boolean}>}
 */
export async function sendSystemEmail({
	to,
	subject,
	text,
	html,
	cc = [],
	replyTo = null,
}) {
	try {
		// Try to get system account token first
		let accessToken = await getSystemAccessToken();
		let usedFallback = false;
		let senderEmail = process.env.SYSTEM_EMAIL_ADDRESS || null;

		// If system token not available, use fallback
		if (!accessToken) {
			console.log("⚠️ System account not available, using fallback auth");
			const fallback = await getFallbackAccessToken();
			if (!fallback) {
				return {
					success: false,
					error: "No authentication method available",
				};
			}
			accessToken = fallback.token;
			usedFallback = true;
			senderEmail = null; // Will use 'me' endpoint
		}

		// Ensure 'to' is an array
		const toArray = Array.isArray(to) ? to : [to];

		// Build email message
		const message = {
			message: {
				subject: subject,
				body: {
					contentType: html ? "HTML" : "Text",
					content: html || text,
				},
				toRecipients: toArray.map((email) => ({
					emailAddress: { address: email },
				})),
				...(cc && cc.length > 0
					? {
							ccRecipients: cc.map((email) => ({
								emailAddress: { address: email },
							})),
					  }
					: {}),
				...(replyTo
					? {
							replyTo: [
								{
									emailAddress: { address: replyTo },
								},
							],
					  }
					: {}),
			},
			saveToSentItems: true,
		};

		// Choose endpoint based on authentication method
		const endpoint = senderEmail
			? `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`
			: `https://graph.microsoft.com/v1.0/me/sendMail`;

		console.log(`📧 Sending email via ${usedFallback ? 'fallback' : 'system'} account to: ${toArray.join(', ')}`);

		const response = await fetch(endpoint, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(`❌ Graph API failed (${response.status}): ${errorText}`);
			return {
				success: false,
				error: `Graph API error: ${response.status}`,
			};
		}

		console.log(`✅ Email sent successfully via ${usedFallback ? 'fallback' : 'system'} account`);
		return { 
			success: true, 
			usedFallback 
		};
	} catch (error) {
		console.error("❌ Error sending system email:", error);
		return {
			success: false,
			error: error.message,
		};
	}
}

/**
 * Send emails to multiple recipients (batch)
 * @param {Array} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} [html] - HTML content
 * @param {Array} [cc] - CC recipients
 * @returns {Promise<Array>} - Array of results
 */
export async function sendBulkSystemEmails(recipients, subject, text, html = null, cc = []) {
	const results = [];

	for (const recipient of recipients) {
		const result = await sendSystemEmail({
			to: recipient,
			subject,
			text,
			html,
			cc,
		});
		results.push({
			email: recipient,
			...result,
		});
	}

	return results;
}
