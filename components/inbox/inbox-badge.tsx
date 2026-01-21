"use client";

import useSWR from "swr";
import { Badge } from "@/components/ui/badge";

const fetcher = async (url: string) => {
	const res = await fetch(url, { credentials: "include" });
	if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
	return res.json();
};

export function InboxBadge() {
	const { data: taskData } = useSWR("/api/workflow-inbox/count", fetcher, {
		keepPreviousData: true,
		revalidateOnFocus: true,
		dedupingInterval: 15_000, // 15s (anti spam fetch)
	});

	const { data: notifData } = useSWR(
		"/api/notifications/unread-count",
		fetcher,
		{
			keepPreviousData: true,
			revalidateOnFocus: true,
			dedupingInterval: 15_000,
		},
	);

	const taskCount = Number(taskData?.count ?? 0);
	const notifCount = Number(notifData?.count ?? 0);
	const total = taskCount + notifCount;

	if (!total) return null;

	return (
		<Badge className="rounded-full px-2 py-0 text-[11px] leading-5">
			{total}
		</Badge>
	);
}
