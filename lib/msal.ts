import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID!;
const clientId = process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID!;
const redirectUri =
	typeof window !== "undefined"
		? `${window.location.origin}/msal-redirect`
		: "http://localhost:3004/msal-redirect";

export const msalInstance = new PublicClientApplication({
	auth: {
		clientId,
		authority: `https://login.microsoftonline.com/${tenantId}`,
		redirectUri,
	},
	cache: {
		cacheLocation: "localStorage", // OK for MVP
		storeAuthStateInCookie: false,
	},
	system: {
		loggerOptions: {
			logLevel: LogLevel.Warning,
			loggerCallback: (level, message) => {
				if (level >= LogLevel.Warning) console.log(message);
			},
		},
	},
});

export const graphScopes = [
	"User.Read",
	"Files.ReadWrite.All",
	"Sites.ReadWrite.All",
];
