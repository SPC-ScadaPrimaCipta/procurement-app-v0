"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
	APPROVER_STRATEGIES,
	APPROVAL_MODES,
	REJECT_TARGET_TYPES,
} from "@/lib/workflow/constants";
import { ApproverSelect } from "./approver-select";
import { Step } from "./workflow-steps-list";
import { RequiredDocumentsSection } from "./required-documents-section";
import Link from "next/link";

type Props = {
	workflowId: string;
	initialStep: Step;
};

export function StepDetailForm({ workflowId, initialStep }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);

	const [name, setName] = useState(initialStep.name);
	const [stepKey, setStepKey] = useState(initialStep.step_key);
	const [approverStrategy, setApproverStrategy] = useState(
		initialStep.approver_strategy,
	);
	const [selectedApprovers, setSelectedApprovers] = useState<
		{ value: string; label: string; description?: string }[]
	>([]);
	const [approvalMode, setApprovalMode] = useState(initialStep.approval_mode);
	const [canSendBack, setCanSendBack] = useState(initialStep.can_send_back);
	const [rejectTargetType, setRejectTargetType] = useState(
		initialStep.reject_target_type,
	);
	const [rejectTargetStepId, setRejectTargetStepId] = useState(
		initialStep.reject_target_step_id || "",
	);
	const [isTerminal, setIsTerminal] = useState(false); // Can be added if needed, though handled by order usually

	useEffect(() => {
		// Init state from prop
		// Reconstruct resolved approvers logic
		if (initialStep.resolved_approvers) {
			const mapped = initialStep.resolved_approvers.map((a: any) => ({
				value: a.id || a.value,
				label: a.name || a.label,
			}));
			if (mapped.length === 0 && initialStep.approver_value) {
				// Fallback attempt
				const values = initialStep.approver_value.split(",");
				const labels = initialStep.approver_label
					? initialStep.approver_label.split(", ")
					: values;
				const constructed = values.map((v, i) => ({
					value: v,
					label: labels[i] || v,
				}));
				setSelectedApprovers(constructed);
			} else {
				setSelectedApprovers(mapped);
			}
		}
	}, [initialStep]);

	const handleSave = async () => {
		setLoading(true);
		try {
			const payload = {
				step_key: stepKey,
				name: name.trim(),
				// step_order: initialStep.step_order, // keep order
				approver_strategy: approverStrategy,
				approver_value: selectedApprovers.map((a) => a.value).join(","), // or JSON array depending on strategy
				approval_mode: approvalMode,
				can_send_back: canSendBack,
				reject_target_type: rejectTargetType,
				reject_target_step_id:
					rejectTargetType === "SPECIFIC" ? rejectTargetStepId : null,
				// is_terminal: isTerminal
			};

			const res = await fetch(
				`/api/workflows/${workflowId}/steps/${initialStep.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				},
			);

			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg);
			}

			toast.success("Step updated successfully");
			router.refresh();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Failed to update step");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<Button variant="ghost" asChild className="pl-0">
					<Link href={`/workflow/manage/${workflowId}`}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Workflow
					</Link>
				</Button>
				<Button
					onClick={handleSave}
					// disabled={loading}
					disabled={true} // disable for now
				>
					{loading && (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					)}
					Save Changes
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Step Details</CardTitle>
					<CardDescription>
						Configure the properties for this workflow step.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="grid md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Label>Step Name</Label>
							<Input
								value={name}
								onChange={(e) => setName(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label>Step Key</Label>
							<Input
								value={stepKey}
								onChange={(e) => setStepKey(e.target.value)}
								placeholder="UNIQUE_KEY"
							/>
						</div>
					</div>

					<Separator />

					<div className="grid md:grid-cols-2 gap-6">
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
								<p className="text-[0.8rem] text-muted-foreground">
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
								<p className="text-[0.8rem] text-muted-foreground">
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

					<Separator />

					<div className="flex items-center justify-between pt-2">
						<Label className="flex flex-col items-start">
							<span>Can Send Back?</span>
							<span className="font-normal text-muted-foreground text-xs">
								Allow approver to reject/send back the request.
							</span>
						</Label>
						<Switch
							checked={canSendBack}
							onCheckedChange={setCanSendBack}
						/>
					</div>

					{canSendBack && (
						<div className="grid md:grid-cols-2 gap-6 pt-2 bg-muted/20 p-4 rounded-md">
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
									<p className="text-[0.8rem] text-muted-foreground">
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
				</CardContent>
			</Card>

			<RequiredDocumentsSection
				workflowId={workflowId}
				stepId={initialStep.id!}
			/>
		</div>
	);
}
