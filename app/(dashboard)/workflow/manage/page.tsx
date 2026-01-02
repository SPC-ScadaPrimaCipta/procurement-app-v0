"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/datatable";
import { createColumns } from "./columns";
import { Workflow } from "./types";

export default function WorkflowsPage() {
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchWorkflows = useCallback(async () => {
		try {
			const res = await fetch("/api/workflows");
			if (!res.ok) {
				throw new Error("Failed to fetch workflows");
			}
			const data = await res.json();
			setWorkflows(data);
		} catch (err) {
			console.error(err);
			setError("Failed to load workflows");
		}
	}, []);

	useEffect(() => {
		setLoading(true);
		fetchWorkflows().finally(() => setLoading(false));
	}, [fetchWorkflows]);

	const columns = useMemo(
		() => createColumns(fetchWorkflows),
		[fetchWorkflows]
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<Loader2
					className="animate-spin text-muted-foreground"
					size={32}
				/>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px] text-destructive">
				{error}
			</div>
		);
	}

	return (
		<div className="md:p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Workflows
					</h1>
					<p className="text-muted-foreground">
						Manage and define your workflow definitions.
					</p>
				</div>
				<Button asChild>
					<Link href="/workflow/manage/new">
						<Plus className="w-4 h-4 mr-2" />
						Create Workflow
					</Link>
				</Button>
			</div>

			<Card>
				<CardContent>
					<DataTable
						columns={columns}
						data={workflows}
						filterKey="name"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
