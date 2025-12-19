"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Loader2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Workflow = {
	id: string;
	code: string;
	name: string;
	version: number;
	description: string | null;
	is_active: boolean;
	workflow_step: any[];
};

export default function WorkflowsPage() {
	const [workflows, setWorkflows] = useState<Workflow[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchWorkflows() {
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
			} finally {
				setLoading(false);
			}
		}

		fetchWorkflows();
	}, []);

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
		<div className="p-6 space-y-6">
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
					<Link href="/workflow/definitions/workflows/new">
						<Plus className="w-4 h-4 mr-2" />
						Create Workflow
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Workflows</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Code</TableHead>
								<TableHead>Name</TableHead>
								<TableHead>Version</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{workflows.length === 0 ? (
								<TableRow>
									<TableCell
										colSpan={6}
										className="text-center h-24 text-muted-foreground"
									>
										No workflows found.
									</TableCell>
								</TableRow>
							) : (
								workflows.map((workflow) => (
									<TableRow key={workflow.id}>
										<TableCell className="font-medium">
											{workflow.code}
										</TableCell>
										<TableCell>{workflow.name}</TableCell>
										<TableCell>
											v{workflow.version}
										</TableCell>
										<TableCell>
											<Badge
												variant={
													workflow.is_active
														? "default"
														: "secondary"
												}
											>
												{workflow.is_active
													? "Active"
													: "Inactive"}
											</Badge>
										</TableCell>
										<TableCell className="text-right">
											<DropdownMenu>
												<DropdownMenuTrigger asChild>
													<Button
														variant="ghost"
														size="icon"
													>
														<MoreHorizontal className="h-4 w-4" />
													</Button>
												</DropdownMenuTrigger>
												<DropdownMenuContent align="end">
													<DropdownMenuItem asChild>
														<Link
															href={`/workflow/definitions/workflows/${workflow.id}`}
														>
															View
														</Link>
													</DropdownMenuItem>
													<DropdownMenuItem disabled>
														New Version
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	);
}
