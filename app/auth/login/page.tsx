"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BoxIcon } from "lucide-react";

export default function LoginPage() {
	const router = useRouter();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// -----------------------
	// Email / Password Login
	// -----------------------
	const handleLogin = async () => {
		setLoading(true);
		setError(null);

		const res = await authClient.signIn.email({
			email,
			password,
		});

		if (res.error) {
			const msg = res.error.message || "Sign In failed.";
			setError(msg);
			setLoading(false);
			return;
		}

		// Success → redirect to dashboard
		router.push("/dashboard");
		console.log("doesn't redirect");
	};

	// -----------------------
	// Microsoft Login
	// -----------------------
	const handleMicrosoftLogin = async () => {
		setLoading(true);
		setError(null);

		// This WILL redirect the browser
		await authClient.signIn.social({
			provider: "microsoft",
			callbackURL: "/dashboard",
		});
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
			<Card className="w-full max-w-sm shadow-lg">
				<CardHeader>
					<CardTitle className="text-center text-2xl font-semibold">
						Login
					</CardTitle>
				</CardHeader>

				<CardContent className="space-y-4">
					<div className="space-y-1">
						<Label>Email</Label>
						<Input
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={loading}
						/>
					</div>

					<div className="space-y-1">
						<Label>Password</Label>
						<PasswordInput
							placeholder="••••••••"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={loading}
						/>
					</div>

					{error && (
						<div className="text-sm text-red-600">{error}</div>
					)}

					<Button
						className="w-full"
						onClick={handleLogin}
						disabled={loading}
					>
						{loading ? "Signing in..." : "Login"}
					</Button>

					{/* Divider */}
					<div className="relative flex items-center">
						<div className="grow border-t" />
						<span className="mx-2 text-xs text-muted-foreground">
							OR
						</span>
						<div className="grow border-t" />
					</div>

					{/* Microsoft Login Button */}
					<Button
						variant="outline"
						className="w-full flex items-center justify-center gap-2"
						onClick={handleMicrosoftLogin}
						disabled={loading}
					>
						<BoxIcon />
						Continue with Microsoft
					</Button>

					<p className="text-center text-sm text-muted-foreground">
						Don’t have an account?{" "}
						<a href="/auth/register" className="underline">
							Register
						</a>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
