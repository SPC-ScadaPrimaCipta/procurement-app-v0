"use client";

import { DataTable } from "@/components/datatable/data-table";
import { RequestItem, columns } from "./columns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { WorkflowRequestsSkeleton } from "@/components/skeletons";

export default function RequestsPage() {
	const [requests, setRequests] = useState<RequestItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		async function fetchRequests() {
			try {
				const res = await fetch("/api/workflow-instances");
				if (!res.ok) {
					console.error("Failed to fetch requests");
					return;
				}
				const data = await res.json();
				setRequests(data);
			} catch (error) {
				console.error("Error loading requests:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchRequests();
	}, []);

	if (isInitialLoading) {
		return <WorkflowRequestsSkeleton />;
	}

	return (
		<div className="space-y-8 animate-in fade-in duration-300">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">My Requests</h1>
					<p className="text-muted-foreground">
						Track the status of your submitted requests.
					</p>
				</div>
				<Button asChild>
					<Link href="/workflow/new">
						<Plus className="mr-2 h-4 w-4" />
						New Request
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Requests</CardTitle>
					<CardDescription>
						A list of all your workflow requests.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{loading ? (
						<div className="flex justify-center p-8 text-muted-foreground">
							Loading requests...
						</div>
					) : (
						<DataTable
							columns={columns}
							data={requests}
							filterKey="title"
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
