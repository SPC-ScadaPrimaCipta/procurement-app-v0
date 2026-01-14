"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
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

export type DraftStep = {
	tempId: string;
	step_key: string;
	name: string;
	step_order: number;
	approver_strategy: string;
	approver_value: string;
	approver_label?: string;
	approval_mode: string;
	can_send_back: boolean;
	reject_target_type: string;
	reject_target_step_id: string | null;
	resolved_approvers: Record<string, any>[] | null;
};

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAddStep: (step: DraftStep) => void;
	nextOrder: number;
};

export function AddStepDialog({
	open,
	onOpenChange,
	onAddStep,
	nextOrder,
}: Props) {
	const [stepKey, setStepKey] = useState("");
	const [name, setName] = useState("");
	const [approverStrategy, setApproverStrategy] = useState("");
	const [selectedApprovers, setSelectedApprovers] = useState<
		{ value: string; label: string; description?: string }[]
	>([]);
	const [approvalMode, setApprovalMode] = useState("ANY");
	const [canSendBack, setCanSendBack] = useState(true);
	const [rejectTargetType, setRejectTargetType] = useState("PREVIOUS");
	const [rejectTargetStepId, setRejectTargetStepId] = useState("");
	const [isTerminal, setIsTerminal] = useState(false);

	function handleAdd() {
		const step: DraftStep = {
			tempId: nanoid(),
			step_key: stepKey.trim(),
			name: name.trim(),
			step_order: nextOrder,
			approver_strategy: approverStrategy,
			approver_value: selectedApprovers.map((a) => a.value).join(","),
			approver_label: selectedApprovers.map((a) => a.label).join(", "),
			approval_mode: approvalMode,
			can_send_back: canSendBack,
			reject_target_type: rejectTargetType,
			reject_target_step_id:
				rejectTargetType === "SPECIFIC" ? rejectTargetStepId : null,
			resolved_approvers: null,
		};

		onAddStep(step);
		onOpenChange(false);

		// reset
		setStepKey("");
		setName("");
		setApproverStrategy("");
		setSelectedApprovers([]);
		setApprovalMode("ANY");
		setCanSendBack(true);
		setRejectTargetType("PREVIOUS");
		setRejectTargetStepId("");
		setIsTerminal(false);
	}

	const convertNameToKey = (name: string) => {
		return name.replace(/\s+/g, "_").toUpperCase();
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add Workflow Step</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<Label>Step Name</Label>
						<Input
							value={name}
							onChange={(e) => {
								setName(e.target.value);
								setStepKey(convertNameToKey(e.target.value));
							}}
							placeholder="Supervisor Approval"
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
											(s) => s.value === approverStrategy
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
											(m) => m.value === approvalMode
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
									(s) => s.value === approverStrategy
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
													t.value === rejectTargetType
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
												e.target.value
											)
										}
										placeholder="Step UUID"
									/>
								</div>
							)}
						</div>
					)}

					{/* <div className="flex items-center justify-between">
						<Label>Terminal Step</Label>
						<Switch
							checked={isTerminal}
							onCheckedChange={setIsTerminal}
						/>
					</div> */}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button onClick={handleAdd}>Add Step</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
