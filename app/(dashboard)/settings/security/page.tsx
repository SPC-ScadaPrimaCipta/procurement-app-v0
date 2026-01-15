"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Textarea } from "@/components/ui/textarea"; // Add Textarea import
import { toast } from "sonner";
import { Key, Smartphone, ShieldCheck } from "lucide-react";

export default function SecurityPage() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [generatedToken, setGeneratedToken] = useState(""); // For Graph Token debug
	const [loading, setLoading] = useState(false);

	const handlePasswordChange = async () => {
		if (!currentPassword || !newPassword || !confirmPassword) {
			toast.error("Please fill in all fields");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("New passwords do not match");
			return;
		}

		if (newPassword.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		setLoading(true);
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
				revokeOtherSessions: true,
			});

			if (error) {
				toast.error(error.message || "Failed to update password");
			} else {
				toast.success("Password updated successfully");
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			}
		} catch (e) {
			toast.error("An unexpected error occurred");
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium flex items-center gap-2">
					<ShieldCheck className="h-5 w-5" /> Security
				</h3>
				<p className="text-sm text-muted-foreground">
					Manage your account security settings and preferences.
				</p>
			</div>

			{/* Password Change */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Key className="h-5 w-5 text-primary" />
						<CardTitle>Password</CardTitle>
					</div>
					<CardDescription>
						Change your password to keep your account secure.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-2">
						<Label htmlFor="current">Current Password</Label>
						<PasswordInput
							id="current"
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
							placeholder="Enter current password"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="new">New Password</Label>
						<PasswordInput
							id="new"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Enter new password"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="confirm">Confirm Password</Label>
						<PasswordInput
							id="confirm"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm new password"
						/>
					</div>
					<div className="flex justify-end">
						<Button
							onClick={handlePasswordChange}
							disabled={loading}
						>
							{loading ? "Updating..." : "Update Password"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Microsoft Connection */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Smartphone className="h-5 w-5 text-primary" />
						<CardTitle>Microsoft Connection</CardTitle>
					</div>
					<CardDescription>
						Connect your Microsoft account to enable SharePoint
						integration.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col gap-2 w-full">
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
							<div className="space-y-1">
								<p className="font-medium">
									SharePoint Integration (Generate Token)
								</p>
								<p className="text-sm text-muted-foreground">
									Generate a Graph Access Token for debugging
									or manual API usage.
								</p>
							</div>
							<Button
								variant="outline"
								onClick={async () => {
									try {
										const { getGraphAccessToken } =
											await import(
												"@/lib/get-graphToken"
											);
										const token =
											await getGraphAccessToken();
										setGeneratedToken(token); // We need to add this state
										toast.success("Token generated!");
									} catch (e: any) {
										console.error(e);
										toast.error(
											"Generation failed: " + e.message
										);
									}
								}}
							>
								Generate Token
							</Button>
						</div>

						{generatedToken && (
							<div className="mt-4 space-y-2">
								<Label>Generated Access Token</Label>
								<div className="flex gap-2">
									<Textarea
										readOnly
										value={generatedToken}
										className="min-h-[100px] font-mono text-xs"
									/>
								</div>
								<Button
									size="sm"
									variant="secondary"
									onClick={() => {
										navigator.clipboard.writeText(
											generatedToken
										);
										toast.success("Copied to clipboard");
									}}
								>
									Copy to Clipboard
								</Button>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* 2FA Placeholder */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<ShieldCheck className="h-5 w-5 text-primary" />
						<CardTitle>Two-Factor Authentication</CardTitle>
					</div>
					<CardDescription>
						Add an extra layer of security to your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="space-y-1">
							<p className="font-medium">
								Two-factor authentication is currently disabled.
							</p>
							<p className="text-sm text-muted-foreground">
								We recommend enabling 2FA for advanced security.
							</p>
						</div>
						<Button variant="outline" disabled>
							Enable 2FA (Coming Soon)
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
