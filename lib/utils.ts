import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatIDR(amount: number | string) {
	const numericAmount =
		typeof amount === "string" ? parseFloat(amount) : amount;
	return new Intl.NumberFormat("id-ID", {
		style: "currency",
		currency: "IDR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(numericAmount);
}

export async function validateMicrosoftSession(router: {
	push: (url: string) => void;
}) {
	try {
		const res = await fetch("/api/auth/check-microsoft-token");
		if (!res.ok) {
			const data = await res.json();
			if (
				data.error === "consent_required" ||
				data.error === "invalid_grant"
			) {
				toast.error("Sesi Microsoft kadaluarsa. Mohon login ulang.");
				await authClient.signOut();
				router.push("/auth/login");
			}
		}
	} catch (error) {
		console.error("Token validation error", error);
	}
}
