import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { refreshMicrosoftToken } from "@/lib/ms-token";

export async function GET(request: Request) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const account = await prisma.account.findFirst({
		where: {
			userId: session.user.id,
			providerId: "microsoft",
		},
	});

	if (!account) {
		return NextResponse.json(
			{ error: "No Microsoft account linked" },
			{ status: 400 }
		);
	}

	// Check if token needs refresh
	const isExpired = account.accessTokenExpiresAt
		? new Date(account.accessTokenExpiresAt).getTime() - 5 * 60 * 1000 <
		  Date.now()
		: true;

	if (isExpired) {
		const newToken = await refreshMicrosoftToken(account);
		if (!newToken) {
			return NextResponse.json(
				{ error: "invalid_grant", message: "Failed to refresh token" },
				{ status: 401 }
			);
		}
	}

	return NextResponse.json({ status: "ok" });
}
