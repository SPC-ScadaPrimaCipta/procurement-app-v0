"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/datatable";
import { createColumns } from "./columns";
import { Workflow } from "./types";
import { WorkflowManageSkeleton } from "@/components/skeletons";

export default function WorkflowsPage() {
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [loading, setLoading] = useState(true);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

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

	if (isInitialLoading || loading) {
		return <WorkflowManageSkeleton />;
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px] text-destructive">
				{error}
			</div>
		);
	}

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-300">
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
