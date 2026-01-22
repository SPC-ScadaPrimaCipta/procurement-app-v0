"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Loader2, Archive, CheckCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { id as idLocale } from "date-fns/locale";
import { NotificationListSkeleton } from "@/components/skeletons/notification-list-skeleton";

interface Notification {
	id: string;
	title: string;
	message: string | null;
	severity: "INFO" | "WARNING" | "ACTION_REQUIRED";
	created_at: string;
	read_at: string | null;
	action_url: string | null;
}

export function NotificationList() {
	const [activeTab, setActiveTab] = useState<"unread" | "all">("unread");
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [loading, setLoading] = useState(true);
	const router = useRouter();

	const fetchNotifications = async () => {
		setLoading(true);
		try {
			const query = new URLSearchParams({
				unreadOnly: activeTab === "unread" ? "true" : "false",
				limit: "50",
			});
			const res = await fetch(`/api/notifications?${query.toString()}`);
			if (!res.ok) throw new Error("Failed to fetch notifications");
			const json = await res.json();
			setNotifications(json.data);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load notifications");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchNotifications();
	}, [activeTab]);

	const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		try {
			// Optimistic update
			setNotifications((prev) =>
				prev.map((n) =>
					n.id === id
						? { ...n, read_at: new Date().toISOString() }
						: n,
				),
			);
			if (activeTab === "unread") {
				// Determine if we should wait for animation or just remove
				// For now, simple remove
				setNotifications((prev) => prev.filter((n) => n.id !== id));
			}

			const res = await fetch(`/api/notifications/${id}/read`, {
				method: "PATCH",
			});
			if (!res.ok) throw new Error("Failed to mark as read");

			router.refresh();
		} catch (error) {
			toast.error("Failed to update notification");
			fetchNotifications();
		}
	};

	const handleArchive = async (id: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		try {
			setNotifications((prev) => prev.filter((n) => n.id !== id));
			const res = await fetch(`/api/notifications/${id}/archive`, {
				method: "PATCH",
			});
			if (!res.ok) throw new Error("Failed to archive");
			router.refresh();
		} catch (error) {
			toast.error("Failed to archive");
			fetchNotifications();
		}
	};

	const handleAction = (n: Notification) => {
		if (n.action_url) {
			if (!n.read_at) handleMarkAsRead(n.id);
			router.push(n.action_url);
		}
	};

	return (
		<>
			{loading ? (
				<NotificationListSkeleton />
			) : (
				<div className="space-y-4">
					<Tabs
						value={activeTab}
						onValueChange={(v) => setActiveTab(v as any)}
						className="w-full"
					>
						<TabsList>
							<TabsTrigger value="unread">Unread</TabsTrigger>
							<TabsTrigger value="all">All Notifications</TabsTrigger>
						</TabsList>

						<div className="mt-4">
							{notifications.length === 0 ? (
								<div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
									<Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
									<p>No notifications found</p>
								</div>
							) : (
						<div className="flex flex-col gap-2">
							{notifications.map((notification) => (
								<div
									key={notification.id}
									className={`
                                group relative flex items-start gap-4 p-4 rounded-lg border transition-all hover:shadow-sm
                                ${
									!notification.read_at
										? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900"
										: "bg-card hover:bg-muted/30"
								}
                                ${notification.action_url ? "cursor-pointer" : ""}
                            `}
									onClick={() => handleAction(notification)}
								>
									<div
										className={`mt-2 h-2.5 w-2.5 rounded-full shrink-0 ${
											!notification.read_at
												? "bg-blue-500"
												: "bg-transparent"
										}`}
									/>

									<div className="flex-1 space-y-1">
										<div className="flex items-center justify-between gap-2">
											<h4
												className={`text-sm font-semibold ${
													!notification.read_at
														? "text-foreground"
														: "text-muted-foreground"
												}`}
											>
												{notification.title}
											</h4>
											<span className="text-xs text-muted-foreground whitespace-nowrap">
												{formatDistanceToNow(
													new Date(
														notification.created_at,
													),
													{
														addSuffix: true,
														locale: idLocale,
													},
												)}
											</span>
										</div>
										<p className="text-sm text-muted-foreground line-clamp-2 pr-16 text-pretty">
											{notification.message}
										</p>
									</div>

									<div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity absolute right-2 bottom-2 md:static md:mt-0">
										{!notification.read_at && (
											<Button
												size="icon"
												variant="ghost"
												className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
												onClick={(e) =>
													handleMarkAsRead(
														notification.id,
														e,
													)
												}
												title="Mark as read"
											>
												<CheckCircle className="h-4 w-4" />
											</Button>
										)}
										<Button
											size="icon"
											variant="ghost"
											className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
											onClick={(e) =>
												handleArchive(
													notification.id,
													e,
												)
											}
											title="Archive"
										>
											<Archive className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</Tabs>
		</div>
			)}
		</>
	);
}
