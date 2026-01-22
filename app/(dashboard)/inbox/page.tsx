"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TaskList } from "./task-list";
import { NotificationList } from "./notification-list";
import { ClipboardList, Bell } from "lucide-react";
import { InboxSkeleton } from "@/components/skeletons/inbox-skeleton";

export default function InboxPage() {
	const [activeSection, setActiveSection] = useState("tasks");
	const [taskCount, setTaskCount] = useState(0);
	const [notificationCount, setNotificationCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		async function fetchCounts() {
			setIsLoading(true);
			try {
				const [taskRes, notifRes] = await Promise.all([
					fetch("/api/workflow-inbox/count"),
					fetch("/api/notifications/unread-count"),
				]);

				if (taskRes.ok) {
					const taskJson = await taskRes.json();
					setTaskCount(taskJson.count);
				}

				if (notifRes.ok) {
					const notifJson = await notifRes.json();
					setNotificationCount(notifJson.count);
				}
			} catch (error) {
				console.error("Failed to fetch inbox counts", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchCounts();
	}, []);

	if (isLoading) {
		return <InboxSkeleton />;
	}

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
					<p className="text-muted-foreground">
						Manage your tasks and view notifications.
					</p>
				</div>
			</div>

			<Tabs
				value={activeSection}
				onValueChange={setActiveSection}
				className="w-full space-y-6"
			>
				<div className="flex items-center">
					<TabsList className="grid w-full max-w-[400px] grid-cols-2 h-10">
						<TabsTrigger value="tasks" className="gap-2">
							<ClipboardList className="h-4 w-4" />
							<span>Tasks</span>
							{taskCount > 0 && (
								<span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-muted-foreground/20 px-1 text-xs font-medium">
									{taskCount}
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="notifications" className="gap-2">
							<Bell className="h-4 w-4" />
							<span>Notifications</span>
							{notificationCount > 0 && (
								<span className="ml-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 px-1 text-xs font-medium">
									{notificationCount}
								</span>
							)}
						</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent
					value="tasks"
					className="border-none p-0 outline-none"
				>
					<TaskList />
				</TabsContent>

				<TabsContent
					value="notifications"
					className="border-none p-0 outline-none"
				>
					<NotificationList />
				</TabsContent>
			</Tabs>
		</div>
	);
}
