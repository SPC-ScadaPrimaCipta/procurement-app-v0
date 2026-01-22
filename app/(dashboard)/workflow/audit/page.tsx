"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { AuditLogItem, columns } from "./columns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { WorkflowAuditSkeleton } from "@/components/skeletons";

export default function AuditPage() {
	const [data, setData] = useState<AuditLogItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const res = await fetch("/api/workflow-history");
				if (!res.ok) throw new Error("Failed to fetch audit logs");
				const json = await res.json();
				setData(json);
			} catch (error) {
				console.error(error);
				toast.error("Failed to load audit logs");
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, []);

	if (isInitialLoading || loading) {
		return <WorkflowAuditSkeleton />;
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-300">
			<div>
				<h1 className="text-2xl font-semibold">Audit Logs</h1>
				<p className="text-muted-foreground">
					Track system changes and user actions for compliance and
					security.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>System Activity</CardTitle>
					<CardDescription>
						A chronological record of significant events.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={data}
						filterKey="workflowTitle"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
