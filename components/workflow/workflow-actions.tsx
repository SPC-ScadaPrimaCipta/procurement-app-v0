"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WorkflowActionsProps {
	stepInstanceId: string;
	onSuccess?: (data?: any) => void;
	approveLabel?: string;
	sendBackLabel?: string;
	onBeforeAction?: (action: "approve" | "sendback") => Promise<boolean>;
}

export function WorkflowActions({
	stepInstanceId,
	onSuccess,
	approveLabel = "Approve",
	sendBackLabel = "Send Back",
	externalComment,
	useExternalComment = false,
	disabled = false,
	onBeforeAction,
}: WorkflowActionsProps & {
	externalComment?: string;
	useExternalComment?: boolean;
	disabled?: boolean;
}) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [rejectOpen, setRejectOpen] = useState(false);
	const [approveOpen, setApproveOpen] = useState(false);
	const [approveComment, setApproveComment] = useState("");
	const [rejectComment, setRejectComment] = useState("");

	const handleAction = async (action: "approve" | "sendback") => {
		try {
			setLoading(true);

			if (onBeforeAction) {
				const shouldProceed = await onBeforeAction(action);
				if (!shouldProceed) {
					setLoading(false);
					return;
				}
			}

			let comment = "";
			if (useExternalComment) {
				comment = externalComment || "";
			} else {
				comment = action === "approve" ? approveComment : rejectComment;
			}

			const endpoint = action === "sendback" ? "send-back" : action;
			const res = await fetch(`/api/workflow-actions/${endpoint}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					stepInstanceId,
					comment,
				}),
			});

			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || `Failed to ${action}`);
			}

			const data = await res.json();

			toast.success(
				`Successfully ${
					action === "approve" ? "approved" : "sent back"
				} the request`
			);
			setRejectOpen(false);
			setApproveOpen(false);

			if (!useExternalComment) {
				setApproveComment("");
				setRejectComment("");
			}

			if (onSuccess) {
				onSuccess(data);
			} else {
				router.refresh();
			}
		} catch (error: any) {
			toast.error(error.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-wrap gap-2 w-full">
			<Button
				variant="outline"
				className="flex-1 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 dark:border-green-800 dark:hover:bg-green-950/30 whitespace-nowrap"
				onClick={() => setApproveOpen(true)}
				disabled={loading || disabled}
			>
				<CheckCircle2 className="mr-2 h-4 w-4" />
				{approveLabel}
			</Button>

			<Button
				variant="outline"
				className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/30 whitespace-nowrap"
				onClick={() => setRejectOpen(true)}
				disabled={loading || disabled}
			>
				<XCircle className="mr-2 h-4 w-4" />
				{sendBackLabel}
			</Button>

			{/* Approve Dialog */}
			<Dialog open={approveOpen} onOpenChange={setApproveOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{approveLabel} Request</DialogTitle>
						<DialogDescription>
							Are you sure you want to{" "}
							{approveLabel.toLowerCase()} this request?
							{!useExternalComment &&
								" You can optionally add a comment."}
						</DialogDescription>
					</DialogHeader>
					{!useExternalComment && (
						<div className="py-4">
							<Textarea
								placeholder="Optional comment..."
								value={approveComment}
								onChange={(e) =>
									setApproveComment(e.target.value)
								}
								className="min-h-[100px]"
							/>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setApproveOpen(false)}
						>
							Cancel
						</Button>
						<Button
							onClick={() => handleAction("approve")}
							disabled={loading}
						>
							{loading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{approveLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Reject Dialog */}
			<Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{sendBackLabel} Request</DialogTitle>
						<DialogDescription>
							Please provide a reason for{" "}
							{sendBackLabel.toLowerCase()} this request.
						</DialogDescription>
					</DialogHeader>
					{!useExternalComment && (
						<div className="py-4">
							<Textarea
								placeholder={`Reason for ${sendBackLabel.toLowerCase()}...`}
								value={rejectComment}
								onChange={(e) =>
									setRejectComment(e.target.value)
								}
								className="min-h-[100px]"
							/>
						</div>
					)}
					<DialogFooter>
						<Button
							variant="ghost"
							onClick={() => setRejectOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => handleAction("sendback")}
							disabled={
								loading ||
								(!useExternalComment && !rejectComment.trim())
							}
						>
							{loading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{sendBackLabel}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
