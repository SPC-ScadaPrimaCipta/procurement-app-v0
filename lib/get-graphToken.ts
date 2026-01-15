"use client";

import { msalInstance, graphScopes } from "@/lib/msal";

export async function getGraphAccessToken(): Promise<string> {
	await msalInstance.initialize();

	// handle redirect if any
	await msalInstance.handleRedirectPromise().catch(() => null);

	let account = msalInstance.getActiveAccount();
	if (!account) {
		const accounts = msalInstance.getAllAccounts();
		if (accounts.length > 0) {
			account = accounts[0];
			msalInstance.setActiveAccount(account);
		}
	}

	// If no account, start login
	if (!account) {
		await msalInstance.loginRedirect({
			scopes: graphScopes,
			// prompt: "select_account",
		});
		throw new Error("Redirecting to Microsoft login...");
	}

	try {
		const res = await msalInstance.acquireTokenSilent({
			scopes: graphScopes,
			account,
		});
		return res.accessToken;
	} catch (e: any) {
		// Need interaction → redirect for consent
		await msalInstance.acquireTokenRedirect({
			scopes: graphScopes,
			account,
			prompt: "consent",
		});
		throw new Error("Redirecting to consent...");
	}
}
