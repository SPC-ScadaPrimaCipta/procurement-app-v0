"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { MonitorItem, columns } from "./columns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WorkflowMonitoringSkeleton } from "@/components/skeletons";

export default function MonitoringPage() {
	const [data, setData] = useState<MonitorItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	const fetchData = async () => {
		try {
			const res = await fetch("/api/workflow-instances?view=all");
			if (!res.ok) throw new Error("Failed to fetch data");
			const json = await res.json();
			setData(json);
		} catch (error) {
			console.error(error);
			toast.error("Failed to load workflow instances");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	if (isInitialLoading || loading) {
		return <WorkflowMonitoringSkeleton />;
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-300">
			<div>
				<h1 className="text-2xl font-semibold">Workflow Monitoring</h1>
				<p className="text-muted-foreground">
					Oversee all workflow instances and track their progress.
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Requests
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{data.length}</div>
						<p className="text-xs text-muted-foreground">
							All time
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.filter((i) => i.status === "PENDING").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Currently active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Approved
						</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.filter((i) => i.status === "APPROVED").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully completed
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Rejected
						</CardTitle>
						<XCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{data.filter((i) => i.status === "REJECTED").length}
						</div>
						<p className="text-xs text-muted-foreground">
							Denied requests
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Workflow Instances</CardTitle>
					<CardDescription>
						A comprehensive list of all workflows in the system.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={data}
						filterKey="title"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
