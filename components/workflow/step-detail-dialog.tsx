"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	APPROVER_STRATEGIES,
	APPROVAL_MODES,
	REJECT_TARGET_TYPES,
} from "@/lib/workflow/constants";
import { ApproverSelect } from "./approver-select";
import { Step } from "./workflow-steps-list";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	step: Step | null;
	onUpdateStep?: (updatedStep: Step) => void;
};

export function StepDetailDialog({
	open,
	onOpenChange,
	step,
	onUpdateStep,
}: Props) {
	const [name, setName] = useState("");
	const [approverStrategy, setApproverStrategy] = useState("");
	const [selectedApprovers, setSelectedApprovers] = useState<
		{ value: string; label: string; description?: string }[]
	>([]);
	const [approvalMode, setApprovalMode] = useState("ANY");
	const [canSendBack, setCanSendBack] = useState(true);
	const [rejectTargetType, setRejectTargetType] = useState("PREVIOUS");
	const [rejectTargetStepId, setRejectTargetStepId] = useState("");

	useEffect(() => {
		if (open && step) {
			setName(step.name);
			setApproverStrategy(step.approver_strategy);
			setApprovalMode(step.approval_mode);
			setCanSendBack(step.can_send_back);
			setRejectTargetType(step.reject_target_type);
			setRejectTargetStepId(step.reject_target_step_id || "");

			// Reconstruct resolved approvers for display
			if (step.resolved_approvers) {
				// Assuming resolved_approvers matches the structure needed for ApproverSelect
				// or we fallback to parsing approver_value if resolved_approvers is missing or different
				const mapped = step.resolved_approvers.map((a: any) => ({
					value: a.id || a.value, // Adjust based on actual data structure
					label: a.name || a.label,
				}));
				// If resolved_approvers doesn't have value, try to split approver_value
				if (mapped.length === 0 && step.approver_value) {
					const values = step.approver_value.split(",");
					const labels = step.approver_label
						? step.approver_label.split(", ")
						: values;
					const constructed = values.map((v, i) => ({
						value: v,
						label: labels[i] || v,
					}));
					setSelectedApprovers(constructed);
				} else {
					setSelectedApprovers(mapped);
				}
			} else {
				setSelectedApprovers([]);
			}
		}
	}, [open, step]);

	function handleSave() {
		if (!step) return;

		const updatedStep: Step = {
			...step,
			name: name.trim(),
			approver_strategy: approverStrategy,
			approver_value: selectedApprovers.map((a) => a.value).join(","),
			approver_label: selectedApprovers.map((a) => a.label).join(", "),
			approval_mode: approvalMode,
			can_send_back: canSendBack,
			reject_target_type: rejectTargetType,
			reject_target_step_id:
				rejectTargetType === "SPECIFIC" ? rejectTargetStepId : null,
			// resolved_approvers would need to be updated or refetched,
			// but for UI update we might just pass what we have
		};

		if (onUpdateStep) {
			onUpdateStep(updatedStep);
		}
		onOpenChange(false);
	}

	if (!step) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Step Details: {step.step_key}</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Step Name</Label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
						/>
					</div>

					<div className="grid md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Approver Type</Label>
							<Select
								value={approverStrategy}
								onValueChange={(val) => {
									setApproverStrategy(val);
									setSelectedApprovers([]);
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select type" />
								</SelectTrigger>
								<SelectContent>
									{APPROVER_STRATEGIES.map((s) => (
										<SelectItem
											key={s.value}
											value={s.value}
										>
											{s.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{approverStrategy && (
								<p className="text-[0.8rem] text-muted-foreground wrap-break-word">
									{
										APPROVER_STRATEGIES.find(
											(s) => s.value === approverStrategy,
										)?.description
									}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label>Approval Mode</Label>
							<Select
								value={approvalMode}
								onValueChange={setApprovalMode}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select mode" />
								</SelectTrigger>
								<SelectContent>
									{APPROVAL_MODES.map((m) => (
										<SelectItem
											key={m.value}
											value={m.value}
										>
											{m.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{approvalMode && (
								<p className="text-[0.8rem] text-muted-foreground wrap-break-word">
									{
										APPROVAL_MODES.find(
											(m) => m.value === approvalMode,
										)?.description
									}
								</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label>Approver Value</Label>
						<ApproverSelect
							strategy={approverStrategy}
							selectedOptions={selectedApprovers}
							onChange={setSelectedApprovers}
							placeholder={
								APPROVER_STRATEGIES.find(
									(s) => s.value === approverStrategy,
								)?.example || "e.g. SUPERVISOR or user-id"
							}
						/>
					</div>

					<div className="flex items-center justify-between pt-2">
						<Label>Can Send Back?</Label>
						<Switch
							checked={canSendBack}
							onCheckedChange={setCanSendBack}
						/>
					</div>

					{canSendBack && (
						<div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
							<div className="space-y-2">
								<Label>Sendback Mode</Label>
								<Select
									value={rejectTargetType}
									onValueChange={setRejectTargetType}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select target" />
									</SelectTrigger>
									<SelectContent>
										{REJECT_TARGET_TYPES.map((t) => (
											<SelectItem
												key={t.value}
												value={t.value}
											>
												{t.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{rejectTargetType && (
									<p className="text-[0.8rem] text-muted-foreground wrap-break-word">
										{
											REJECT_TARGET_TYPES.find(
												(t) =>
													t.value ===
													rejectTargetType,
											)?.description
										}
									</p>
								)}
							</div>

							{rejectTargetType === "SPECIFIC" && (
								<div className="space-y-2">
									<Label>Target Step ID</Label>
									<Input
										value={rejectTargetStepId}
										onChange={(e) =>
											setRejectTargetStepId(
												e.target.value,
											)
										}
										placeholder="Step UUID"
									/>
								</div>
							)}
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Close
					</Button>
					<Button onClick={handleSave} disabled={!onUpdateStep}>
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
