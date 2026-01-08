"use client";

import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	ShieldCheck,
	GitBranch,
	Settings,
	LayoutDashboard,
	BookOpen,
} from "lucide-react";

export default function HelpPage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Help & Documentation
				</h1>
				<p className="text-muted-foreground">
					Learn how to navigate and use the dashboard effectively.
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Introduction */}
				<Card className="col-span-full">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<LayoutDashboard className="h-5 w-5" /> Introduction
						</CardTitle>
						<CardDescription>
							Overview of the dashboard capabilities.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground leading-relaxed">
							Welcome to the dashboard! This platform is designed
							to help you organize workflows, manage users, and
							configure system settings. Use the sidebar to
							navigate between different sections. The dashboard
							provides a centralized view of all your activities
							and pending tasks.
						</p>
					</CardContent>
				</Card>

				{/* Admin Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShieldCheck className="h-5 w-5" /> Admin Panel
						</CardTitle>
						<CardDescription>
							User & Role Management
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>
							<strong>Users:</strong> View, create, and manage
							system users. Assign roles to control access levels.
						</p>
						<p>
							<strong>Roles:</strong> Define roles and associate
							them with specific permissions.
						</p>
						<p>
							<strong>Permissions:</strong> Granular control over
							what resources users can access or modify (e.g.,
							read, create, update, delete).
						</p>
					</CardContent>
				</Card>

				{/* Workflow Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<GitBranch className="h-5 w-5" /> Workflows
						</CardTitle>
						<CardDescription>Process Automation</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>
							<strong>Inbox:</strong> View tasks assigned to you
							that require attention or approval.
						</p>
						<p>
							<strong>My Requests:</strong> Track the status of
							workflows you have initiated.
						</p>
						<p>
							<strong>Manage Workflow:</strong> (Admin only)
							Design and configure workflow definitions and steps.
						</p>
					</CardContent>
				</Card>

				{/* Settings Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Settings className="h-5 w-5" /> Settings
						</CardTitle>
						<CardDescription>Account & Preferences</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2 text-sm text-muted-foreground">
						<p>
							<strong>Profile:</strong> Update your personal
							information and profile picture.
						</p>
						<p>
							<strong>Account Security:</strong> Manage your
							password and security settings.
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="mt-8">
				<h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
					<BookOpen className="h-5 w-5" /> FAQ
				</h2>
				<div className="grid gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								How do I reset my password?
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Go to{" "}
								<strong>Settings &gt; Account Security</strong>.
								You will find options to change your password
								there.
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								I cannot access the Admin panel.
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground">
								Access to the Admin panel is restricted to users
								with the appropriate role (e.g., Admin,
								Superadmin). If you believe you should have
								access, please contact your system
								administrator.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
