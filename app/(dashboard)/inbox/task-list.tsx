"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, InboxItem } from "./columns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TaskList() {
	const [activeTab, setActiveTab] = useState("pending");
	const [data, setData] = useState<InboxItem[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let ignored = false;
		async function fetchInbox() {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/workflow-inbox?type=${activeTab}&all=true`,
				);
				if (!res.ok) throw new Error("Failed to fetch inbox");
				const json = await res.json();
				if (!ignored) {
					const mapped: InboxItem[] = json.items.map((item: any) => {
						let link = "#";
						let title = item.data.title;
						let message = `Step: ${item.stepName}`;

						if (item.refType === "PROCUREMENT_CASE") {
							link = `/pengadaan/${item.refId}`;
							message = `Request from ${item.requestedBy} for ${item.title}`;
						} else if (item.refType === "NOTA_DINAS") {
							link = `/nota-dinas/surat-masuk/${item.refId}`;
							message = `Nota Dinas from ${item.requestedBy}`;
						}

						return {
							id: item.id,
							title: title,
							message: message,
							type: "approval",
							reference_code: item.workflowCode,
							from: item.requestedBy,
							status: activeTab === "pending" ? "unread" : "read",
							created_at: item.createdAt,
							link: link,
						};
					});
					setData(mapped);
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

	return (
		<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
					<CardContent className="p-0">
						{loading ? (
							<div className="flex justify-center p-8">
								<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
							</div>
						) : (
							<div className="p-4">
								<DataTable
									columns={columns}
									data={data}
									filterKey="title"
								/>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</Tabs>
	);
}
