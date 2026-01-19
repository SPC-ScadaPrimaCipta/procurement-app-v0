"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { PasswordInput } from "@/components/ui/password-input";
import { ProfileSkeleton } from "@/components/skeletons/profile-skeleton";
import { Activity, User } from "lucide-react";

export default function ProfilePage() {
	const [loadingProfile, setLoadingProfile] = useState(false);
	const [loadingPassword, setLoadingPassword] = useState(false);
	const [profileLoaded, setProfileLoaded] = useState(false);

	// Editable user fields
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [initialEmail, setInitialEmail] = useState("");

	// Password fields
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [sessionData, setSessionData] = useState<any>(null);

	// ------------------------------
	// Load user profile on mount
	// ------------------------------
	useEffect(() => {
		async function loadUser() {
			const { data } = await authClient.getSession();

			if (!data?.user) return;

			setSessionData(data);
			setName(data.user.name || "");
			setEmail(data.user.email || "");
			setInitialEmail(data.user.email || "");

			setProfileLoaded(true);
		}

		loadUser();
	}, []);

	// ------------------------------
	// Update Profile Information
	// ------------------------------
	async function handleUpdateProfile() {
		setLoadingProfile(true);

		try {
			if (email !== initialEmail) {
				const emailRes = await authClient.changeEmail({
					newEmail: email,
					callbackURL: "/settings/profile",
				});

				if (emailRes.error) {
					toast.error(
						emailRes.error.message || "Failed to update email."
					);
				} else {
					// If verification is required, show a success message
					// toast.success(
					// 	"Email verification sent. Please check your inbox."
					// );

					// When without verification
					toast.success("Email updated successfully.");
					setInitialEmail(email); // Update initial email to reflect the change
				}
			}

			const res = await authClient.updateUser({
				name,
			});

			if (res.error) {
				toast.error(res.error.message || "Failed to update profile.");
			} else {
				toast.success("Profile updated successfully.");
			}
		} catch (err) {
			toast.error("Unexpected error while updating profile.");
			console.error("Error", err);
		} finally {
			setLoadingProfile(false);
		}
	}

	// ------------------------------
	// Update Password
	// ------------------------------
	async function handlePasswordChange() {
		if (!currentPassword || !newPassword) {
			toast.error("Please fill all password fields.");
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error("Passwords do not match.");
			return;
		}

		setLoadingPassword(true);

		try {
			const res = await authClient.changePassword({
				newPassword,
				currentPassword,
				revokeOtherSessions: true,
			});

			if (res.error) {
				toast.error(res.error.message || "Failed to update password.");
			} else {
				toast.success("Password updated successfully.");

				// reset fields
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			}
		} catch (err) {
			toast.error("Unexpected error while updating password.");
			console.error("Error", err);
		} finally {
			setLoadingPassword(false);
		}
	}

	// ------------------------------
	// Admin Check Logic
	// ------------------------------
	const [adminCheckResult, setAdminCheckResult] = useState<{
		status: string;
		data: any;
	} | null>(null);

	async function checkAdminAccess() {
		setAdminCheckResult(null);
		try {
			const { data, error } = await authClient.admin.listUsers({
				query: {
					limit: 100,
					offset: 100,
					sortBy: "name",
					sortDirection: "desc",
				},
			});

			if (error) {
				setAdminCheckResult({ status: "error", data: error });
				toast.error("Admin check failed: Forbidden or Error");
			} else {
				setAdminCheckResult({ status: "success", data: data });
				toast.success("Admin check passed!");
			}
		} catch (err: any) {
			setAdminCheckResult({
				status: "error",
				data: { message: err.message },
			});
		}
	}

	if (!profileLoaded) {
		return <ProfileSkeleton />;
	}

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Profile</h1>
					<p className="text-muted-foreground">
						Manage your account settings and preferences.
					</p>
				</div>
			</header>

			{/* Profile Information */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<User className="h-5 w-5 text-primary" />
						<CardTitle>Profile Information</CardTitle>
					</div>
					<CardDescription>
						Update your name and email address.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label className="mb-2 md:mb-3">Name</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div>
						<Label className="mb-2 md:mb-3">Email</Label>
						<Input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
						/>
					</div>

					<Button
						onClick={handleUpdateProfile}
						disabled={loadingProfile}
					>
						{loadingProfile ? "Saving..." : "Save Changes"}
					</Button>
				</CardContent>
			</Card>

			{/* Password Section */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Change Password</CardTitle>
					<CardDescription>
						Ensure your account is secure by using a strong
						password.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label className="mb-2 md:mb-3">Current Password</Label>
						<PasswordInput
							value={currentPassword}
							onChange={(e) => setCurrentPassword(e.target.value)}
						/>
					</div>

					<div>
						<Label className="mb-2 md:mb-3">New Password</Label>
						<PasswordInput
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
						/>
					</div>

					<div>
						<Label className="mb-2 md:mb-3">
							Confirm New Password
						</Label>
						<PasswordInput
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
						/>
					</div>

					<Button
						variant="default"
						onClick={handlePasswordChange}
						disabled={loadingPassword}
					>
						{loadingPassword ? "Updating..." : "Update Password"}
					</Button>
				</CardContent>
			</Card> */}

			{/* Session Details (Debug) */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<Activity className="h-5 w-5 text-primary" />
						<CardTitle>Session Details</CardTitle>
					</div>
					<CardDescription>
						View your current session data, including roles and
						permissions.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs font-mono">
						<pre>
							{sessionData
								? JSON.stringify(sessionData, null, 2)
								: "No session data available"}
						</pre>
					</div>

					<div className="border-t pt-4 mt-4">
						<Label className="text-sm font-semibold mb-2 block">
							Admin Access Checker
						</Label>
						<p className="text-xs text-muted-foreground mb-4">
							Click below to test if you can list users via the
							admin API.
						</p>
						<Button
							onClick={checkAdminAccess}
							size="sm"
							variant="outline"
						>
							Check Admin Capabilities
						</Button>

						{adminCheckResult && (
							<div className="mt-4 p-3 rounded bg-slate-100 dark:bg-slate-900 border text-xs font-mono overflow-auto max-h-60">
								<p
									className={
										adminCheckResult.status === "success"
											? "text-green-600 font-bold"
											: "text-red-500 font-bold"
									}
								>
									Status:{" "}
									{adminCheckResult.status.toUpperCase()}
								</p>
								<pre className="mt-2 text-muted-foreground">
									{JSON.stringify(
										adminCheckResult.data,
										null,
										2
									)}
								</pre>
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
