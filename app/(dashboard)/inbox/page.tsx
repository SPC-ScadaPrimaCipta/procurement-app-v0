"use client";

import { useEffect, useState } from "react";
import { Mail, CheckCircle2, FileText, ArrowRight } from "lucide-react";
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
import { Loader2 } from "lucide-react";

export default function InboxPage() {
	const [activeTab, setActiveTab] = useState("pending");
	const [data, setData] = useState<InboxItem[]>([]);
	const [loading, setLoading] = useState(true);

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
					// Map API response to InboxItem
					// Note: ID in API response is stepInstanceId, here we want to identify the row.
					const mapped: InboxItem[] = json.items.map((item: any) => {
						let link = "#";
						let title = item.title;
						let message = `Step: ${item.stepName}`;

						if (item.refType === "PROCUREMENT_CASE") {
							link = `/pengadaan/${item.refId}`;
							// We might want to fetch more details about the case if needed, or rely on what's available
							message = `Request from ${item.requestedBy} for ${item.title}`;
						} else if (item.refType === "NOTA_DINAS") {
							// Assuming routing for nota dinas
							link = `/nota-dinas/surat-masuk/${item.refId}`;
							message = `Nota Dinas from ${item.requestedBy}`;
						}

						return {
							id: item.id,
							title: title, // Or maybe item.workflowCode + " - " + item.stepName
							message: message,
							type: "approval", // Workflow inbox items are usually approvals/tasks
							reference_code: item.workflowCode,
							from: item.requestedBy,
							status: activeTab === "pending" ? "unread" : "read", // Simple heuristic
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
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Kotak Masuk
					</h1>
					<p className="text-muted-foreground">
						Notifikasi, tugas, dan permintaan persetujuan Anda.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="bg-muted px-3 py-1 rounded-full text-sm font-medium">
						{data.length}{" "}
						{activeTab === "pending" ? "Tasks" : "Items"}
					</div>
				</div>
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
		</div>
	);
}
