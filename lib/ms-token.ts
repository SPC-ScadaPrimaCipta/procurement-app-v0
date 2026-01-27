import prisma from "@/lib/prisma";

export async function refreshMicrosoftAccessToken(params: {
	tenantId: string;
	clientId: string;
	clientSecret: string;
	refreshToken: string;
}) {
	const tokenUrl = `https://login.microsoftonline.com/${params.tenantId}/oauth2/v2.0/token`;

	const body = new URLSearchParams();
	body.set("client_id", params.clientId);
	body.set("client_secret", params.clientSecret);
	body.set("grant_type", "refresh_token");
	body.set("refresh_token", params.refreshToken);
	body.set("scope", "https://graph.microsoft.com/.default offline_access");

	const res = await fetch(tokenUrl, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: body.toString(),
	});

	const json = await res.json();
	if (!res.ok)
		throw new Error(`refresh token failed: ${JSON.stringify(json)}`);

	return {
		accessToken: json.access_token as string,
		refreshToken:
			(json.refresh_token as string | undefined) ?? params.refreshToken,
		expiresIn: json.expires_in as number, // seconds
	};
}

export async function refreshMicrosoftToken(account: any) {
	console.log("Access token expired, refreshing...");
	try {
		const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
		const clientId = process.env.MICROSOFT_CLIENT_ID!;
		const clientSecret = process.env.MICROSOFT_CLIENT_SECRET!;

		if (!clientId || !clientSecret) {
			throw new Error("Missing Microsoft Client ID or Secret env vars");
		}

		const tokens = await refreshMicrosoftAccessToken({
			tenantId,
			clientId,
			clientSecret,
			refreshToken: account.refreshToken,
		});

		// Update Account in DB
		const newExpiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
		await prisma.account.update({
			where: { id: account.id },
			data: {
				accessToken: tokens.accessToken,
				accessTokenExpiresAt: newExpiresAt,
				refreshToken: tokens.refreshToken, // Rotate if new one provided
				updatedAt: new Date(),
			},
		});

		console.log("Token refreshed successfully.");
		return tokens.accessToken;
	} catch (refreshError) {
		console.error("Token refresh failed:", refreshError);
		return null;
	}
}
