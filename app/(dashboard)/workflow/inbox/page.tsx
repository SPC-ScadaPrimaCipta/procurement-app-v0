"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { InboxItem, columns } from "./columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { WorkflowInboxSkeleton } from "@/components/skeletons";

export default function InboxPage() {
	const [activeTab, setActiveTab] = useState("pending");
	const [data, setData] = useState<InboxItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		let ignored = false;
		async function fetchInbox() {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/workflow-inbox?type=${activeTab}`
				);
				if (!res.ok) throw new Error("Failed to fetch inbox");
				const json = await res.json();
				if (!ignored) {
					setData(json.items);
				}
			} catch (error) {
				console.error("Failed to fetch inbox items", error);
			} finally {
				if (!ignored) setLoading(false);
			}
		}

		fetchInbox();
		return () => {
			ignored = true;
		};
	}, [activeTab]);

	if (isInitialLoading) {
		return <WorkflowInboxSkeleton />;
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-300">
			<div>
				<h1 className="text-2xl font-semibold">Inbox</h1>
				<p className="text-muted-foreground">
					Manage your pending tasks and view request history.
				</p>
			</div>

			<Tabs
				value={activeTab}
				onValueChange={setActiveTab}
				className="w-full"
			>
				<TabsList>
					<TabsTrigger value="pending">Pending</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
				</TabsList>

				<div className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>
								{activeTab === "pending"
									? "Pending Requests"
									: "Request History"}
							</CardTitle>
							<CardDescription>
								{activeTab === "pending"
									? "Requests waiting for your approval."
									: "View past requests and their outcomes."}
							</CardDescription>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="flex justify-center p-8">
									<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
								</div>
							) : (
								<DataTable
									columns={columns}
									data={data}
									filterKey="title"
								/>
							)}
						</CardContent>
					</Card>
				</div>
			</Tabs>
		</div>
	);
}
