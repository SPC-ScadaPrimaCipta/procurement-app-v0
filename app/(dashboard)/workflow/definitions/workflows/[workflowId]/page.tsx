"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
	ArrowLeft,
	CheckCircle2,
	GitBranch,
	Loader2,
	MoreHorizontal,
	Plus,
	User,
	Users,
} from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import {
	WorkflowStepsList,
	Step,
} from "@/components/workflow/workflow-steps-list";

type Workflow = {
	id: string;
	code: string;
	name: string;
	version: number;
	description: string | null;
	is_active: boolean;
	created_at: string;
};

export default function WorkflowDetailPage() {
	const params = useParams();
	const workflowId = params.workflowId as string;

	const [loading, setLoading] = useState(true);
	const [workflow, setWorkflow] = useState<Workflow | null>(null);
	const [steps, setSteps] = useState<Step[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (!workflowId) return;

		async function fetchData() {
			setLoading(true);
			try {
				const [wfRes, stepsRes] = await Promise.all([
					fetch(`/api/workflows/${workflowId}`),
					fetch(`/api/workflows/${workflowId}/steps`),
				]);

				if (!wfRes.ok)
					throw new Error("Failed to load workflow details");
				if (!stepsRes.ok)
					throw new Error("Failed to load workflow steps");

				const wfData = await wfRes.json();
				const stepsData = await stepsRes.json();

				setWorkflow(wfData);
				setSteps(stepsData);
			} catch (err) {
				console.error(err);
				setError("Failed to load data");
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, [workflowId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-full min-h-[400px]">
				<Loader2 className="animate-spin text-muted-foreground mr-2" />
				Loading workflow...
			</div>
		);
	}

	if (error || !workflow) {
		return (
			<div className="flex flex-col items-center justify-center h-[400px] text-destructive">
				<p className="font-semibold">{error || "Workflow not found"}</p>
				<Button
					variant="ghost"
					asChild
					className="mt-4 text-foreground"
				>
					<Link href="/workflow/definitions/workflows">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Workflows
					</Link>
				</Button>
			</div>
		);
	}

	const handleAddStep = (step: Step) => {
		console.log("Steps", [...steps, step]);
		setSteps((prev) => [...prev, step]);
	};

	// Handle simple move (swap) in local state
	const handleMoveStep = (index: number, direction: "up" | "down") => {
		const newSteps = [...steps];
		if (direction === "up") {
			if (index <= 0) return;
			[newSteps[index - 1], newSteps[index]] = [
				newSteps[index],
				newSteps[index - 1],
			];
		} else {
			if (index >= newSteps.length - 1) return;
			[newSteps[index + 1], newSteps[index]] = [
				newSteps[index],
				newSteps[index + 1],
			];
		}
		// Reset step orders based on new index
		const reordered = newSteps.map((s, idx) => ({
			...s,
			step_order: idx + 1,
		}));
		setSteps(reordered);
	};

	const handleDeleteStep = (index: number) => {
		const newSteps = [...steps];
		newSteps.splice(index, 1);
		// Reset step orders
		const reordered = newSteps.map((s, idx) => ({
			...s,
			step_order: idx + 1,
		}));
		setSteps(reordered);
	};

	async function handleSaveChanges() {
		setIsSaving(true);
		try {
			// Prepare steps for saving
			const formattedSteps = steps.map((step, index) => {
				const isLast = index === steps.length - 1;
				return {
					...step,
					is_terminal: isLast,
					approver_value: step.approver_value
						? step.approver_value.split(",").map((s) => s.trim())
						: [],
				};
			});

			// Send the entire list to Sync (Update/Create/Delete)
			const res = await fetch(`/api/workflows/${workflowId}/steps`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formattedSteps),
			});

			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg);
			}

			toast.success("Changes saved successfully");

			// Reload data to get real IDs
			const stepsRes = await fetch(`/api/workflows/${workflowId}/steps`);
			const stepsData = await stepsRes.json();
			setSteps(stepsData);
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Failed to save changes");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="max-w-5xl mx-auto py-8 px-4 space-y-8">
			{/* Top Navigation */}
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					className="pl-0 hover:pl-2 transition-all"
					asChild
				>
					<Link href="/workflow/definitions/workflows">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Listings
					</Link>
				</Button>
				<div className="flex gap-2">
					{/* Save Changes Button */}
					<Button
						onClick={handleSaveChanges}
						disabled={isSaving || loading}
					>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<CheckCircle2 className="mr-2 h-4 w-4" />
								Save Changes
							</>
						)}
					</Button>
				</div>
			</div>

			{/* 1. Top Section: Workflow Details */}
			<Card className="bg-muted/40 border-dashed">
				<CardHeader>
					<div className="flex justify-between items-start">
						<div>
							<CardTitle className="text-3xl font-bold flex items-center gap-3">
								{workflow.name}
								<Badge variant="outline" className="text-sm">
									v{workflow.version}
								</Badge>
								<Badge
									variant={
										workflow.is_active
											? "default"
											: "secondary"
									}
								>
									{workflow.is_active ? "Active" : "Draft"}
								</Badge>
							</CardTitle>
							<CardDescription className="mt-2 text-base">
								{workflow.description ||
									"No description provided."}
							</CardDescription>
						</div>
						<div className="text-right text-sm text-muted-foreground">
							<p>Code: {workflow.code}</p>
							<p>
								Created:{" "}
								{new Date(
									workflow.created_at
								).toLocaleDateString()}
							</p>
						</div>
					</div>
				</CardHeader>
			</Card>

			<Separator />

			{/* 2. Steps Section: Connected Cards */}
			<WorkflowStepsList
				workflowId={workflowId}
				steps={steps}
				onAddStep={handleAddStep}
				onMoveStep={handleMoveStep}
				onDeleteStep={handleDeleteStep}
			/>
		</div>
	);
}
