import prisma from "@/lib/prisma";

export async function refreshMicrosoftToken(account: any) {
	console.log("Access token expired, refreshing...");
	try {
		const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
		const tokenResponse = await fetch(
			`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body: new URLSearchParams({
					client_id: process.env.MICROSOFT_CLIENT_ID!,
					client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
					grant_type: "refresh_token",
					refresh_token: account.refreshToken,
					scope: "Files.ReadWrite.All Sites.Read.All offline_access",
				}),
			}
		);

		if (!tokenResponse.ok) {
			const errorText = await tokenResponse.text();
			console.error("Failed to refresh token:", errorText);
			throw new Error("Failed to refresh Microsoft token");
		}

		const tokens = await tokenResponse.json();

		// Update Account in DB
		const newExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
		await prisma.account.update({
			where: { id: account.id },
			data: {
				accessToken: tokens.access_token,
				accessTokenExpiresAt: newExpiresAt,
				refreshToken: tokens.refresh_token || account.refreshToken, // Rotate if new one provided
				updatedAt: new Date(),
			},
		});

		console.log("Token refreshed successfully.");
		return tokens.access_token;
	} catch (refreshError) {
		console.error("Token refresh failed:", refreshError);
		return null;
	}
}
