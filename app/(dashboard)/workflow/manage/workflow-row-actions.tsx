"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import { Workflow } from "./types";

interface WorkflowRowActionsProps {
	workflow: Workflow;
	onUpdate: () => void;
}

export function WorkflowRowActions({
	workflow,
	onUpdate,
}: WorkflowRowActionsProps) {
	const router = useRouter();
	const [confirmingWorkflowId, setConfirmingWorkflowId] = useState<
		string | null
	>(null);

	const handleActivate = async () => {
		try {
			const res = await fetch(`/api/workflows/${workflow.id}/activate`, {
				method: "POST",
			});

			if (!res.ok) throw new Error("Failed to activate workflow");

			toast.success("Workflow activated");
			onUpdate();
		} catch (error) {
			console.error(error);
			toast.error("Failed to activate workflow");
		}
	};

	const handleDeactivate = async () => {
		try {
			const res = await fetch(
				`/api/workflows/${workflow.id}/deactivate`,
				{
					method: "POST",
				}
			);

			if (!res.ok) throw new Error("Failed to deactivate workflow");

			toast.success("Workflow deactivated");
			onUpdate();
		} catch (error) {
			console.error(error);
			toast.error("Failed to deactivate workflow");
		}
	};

	const handleNewVersion = async () => {
		try {
			const res = await fetch(
				`/api/workflows/${workflow.id}/new-version`,
				{
					method: "POST",
				}
			);

			if (!res.ok) throw new Error("Failed to create new version");

			const newWorkflow = await res.json();
			toast.success("New version created");
			router.push(`/workflow/manage/${newWorkflow.id}`);
		} catch (error) {
			console.error(error);
			toast.error("Failed to create new version");
		}
	};

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem asChild>
						<Link href={`/workflow/manage/${workflow.id}`}>
							View
						</Link>
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => setConfirmingWorkflowId(workflow.id)}
					>
						New Version
					</DropdownMenuItem>
					{!workflow.is_active ? (
						<DropdownMenuItem onClick={handleActivate}>
							Activate
						</DropdownMenuItem>
					) : (
						<DropdownMenuItem onClick={handleDeactivate}>
							Deactivate
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<ConfirmationDialog
				open={!!confirmingWorkflowId}
				onOpenChange={(open) => !open && setConfirmingWorkflowId(null)}
				title="Create New Version"
				description="Are you sure you want to create a new version of this workflow? This will create a new draft version based on the current one."
				confirmText="Create"
				onConfirm={() => {
					handleNewVersion();
					setConfirmingWorkflowId(null);
				}}
			/>
		</>
	);
}
