"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import {
	APPROVER_STRATEGIES,
	APPROVAL_MODES,
	REJECT_TARGET_TYPES,
} from "@/lib/workflow/constants";

// Validation Schema
const stepSchema = z.object({
	stepKey: z
		.string()
		.min(3, "Key must be at least 3 characters")
		.regex(
			/^[A-Z0-9_]+$/,
			"Key must contain only uppercase letters, numbers, and underscores"
		),
	name: z.string().min(3, "Name must be at least 3 characters"),
	order: z.coerce.number().min(1, "Order must be at least 1"),
	approverStrategy: z.string().min(1, "Strategy is required"),
	approverValue: z.string().min(1, "Approver value is required"),
	approvalMode: z.string().optional(),
	rejectTargetType: z.string().optional(),
	rejectTargetStepId: z.string().optional().or(z.literal("")),
	canSendBack: z.boolean().default(true),
	isTerminal: z.boolean().default(false),
});

// Explicit type definition to fix resolver mismatch
type StepFormValues = {
	stepKey: string;
	name: string;
	order: number;
	approverStrategy: string;
	approverValue: string;
	approvalMode?: string;
	rejectTargetType?: string;
	rejectTargetStepId?: string;
	canSendBack: boolean;
	isTerminal: boolean;
};

export default function NewStepPage() {
	const router = useRouter();
	const params = useParams();
	const workflowId = params.workflowId as string;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<StepFormValues>({
		resolver: zodResolver(stepSchema as any), // Type assertion to bypass strict schema inference mismatch with coerce
		defaultValues: {
			stepKey: "",
			name: "",
			order: 1,
			approverStrategy: "",
			approverValue: "",
			approvalMode: "ANY",
			rejectTargetType: "PREVIOUS",
			rejectTargetStepId: "",
			canSendBack: true,
			isTerminal: false,
		},
	});

	const approverStrategy = watch("approverStrategy");

	async function onSubmit(data: StepFormValues) {
		setIsSubmitting(true);
		try {
			// Backend expects snake_case payload currently, matching the API we have.
			// Re-checking api logic from earlier: it takes raw body and uses it.
			// Let's verify route 'app/api/workflows/[code]/steps' (which user might not have created yet?)
			// Wait, the previous file used: `/api/workflows/${params.workflowId}/steps`
			// Let's assume there is a POST endpoint to create steps for a specific workflow ID.
			// The user's code was using:
			// body: JSON.stringify({
			//     step_key: stepKey,
			//     name,
			//     step_order: order,
			//     approver_strategy: approverStrategy,
			//     approver_value: approverValue,
			// }),
			// So I should map my camelCase form values to snake_case payload.

			const payload = {
				step_key: data.stepKey,
				name: data.name,
				step_order: data.order,
				approver_strategy: data.approverStrategy,
				approver_value: data.approverValue,
				approval_mode: data.approvalMode,
				reject_target_type: data.rejectTargetType,
				reject_target_step_id: data.rejectTargetStepId || null,
				// is_terminal: data.isTerminal // if needed
			};

			const res = await fetch(`/api/workflows/${workflowId}/steps`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const msg = await res.text();
				throw new Error(msg || "Failed to create step");
			}

			toast.success("Step created successfully");
			router.push(`/workflow/manage/${workflowId}`);
		} catch (error) {
			console.error(error);
			toast.error("Failed to create step. Please check your inputs.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="max-w-3xl mx-auto py-8 px-4">
			<div className="mb-6">
				<Button
					variant="ghost"
					className="pl-0 hover:pl-2 transition-all"
					asChild
				>
					<Link href={`/workflow/manage/${workflowId}`}>
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Workflow
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						Add Workflow Step
					</CardTitle>
					<CardDescription>
						Define the rules and approvers for this step.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Left Column: Basic Info */}
							<div className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="stepKey">Step Key</Label>
									<Input
										id="stepKey"
										placeholder="e.g. MANAGER_APPROVAL"
										{...register("stepKey")}
										className={
											errors.stepKey
												? "border-destructive"
												: ""
										}
									/>
									{errors.stepKey && (
										<p className="text-sm text-destructive">
											{errors.stepKey.message}
										</p>
									)}
									<p className="text-xs text-muted-foreground">
										Uppercase, numbers, and underscores
										only.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="name">Step Name</Label>
									<Input
										id="name"
										placeholder="e.g. Manager Approval"
										{...register("name")}
										className={
											errors.name
												? "border-destructive"
												: ""
										}
									/>
									{errors.name && (
										<p className="text-sm text-destructive">
											{errors.name.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="order">
										Order Sequence
									</Label>
									<Input
										id="order"
										type="number"
										min="1"
										{...register("order")}
										className={
											errors.order
												? "border-destructive"
												: ""
										}
									/>
									<p className="text-xs text-muted-foreground">
										Determines the sequence in the workflow
										(e.g. 1, 2, 3...)
									</p>
									{errors.order && (
										<p className="text-sm text-destructive">
											{errors.order.message}
										</p>
									)}
								</div>
							</div>

							{/* Right Column: Logic & Approvers */}
							<div className="space-y-6">
								<div className="space-y-2">
									<Label htmlFor="approverStrategy">
										Approver Strategy
									</Label>
									<Controller
										control={control}
										name="approverStrategy"
										render={({ field }) => (
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<SelectTrigger
													className={
														errors.approverStrategy
															? "border-destructive"
															: ""
													}
												>
													<SelectValue placeholder="Select strategy" />
												</SelectTrigger>
												<SelectContent>
													{APPROVER_STRATEGIES.map(
														(s) => (
															<SelectItem
																key={s.value}
																value={s.value}
															>
																{s.label}
															</SelectItem>
														)
													)}
												</SelectContent>
											</Select>
										)}
									/>
									{errors.approverStrategy && (
										<p className="text-sm text-destructive">
											{errors.approverStrategy.message}
										</p>
									)}
								</div>

								<div className="space-y-2">
									<Label htmlFor="approverValue">
										Approver Value
									</Label>
									<Input
										id="approverValue"
										placeholder={
											approverStrategy === "USER"
												? "e.g. user-id-uuid"
												: approverStrategy === "ROLE"
												? "e.g. manager"
												: approverStrategy === "DYNAMIC"
												? "e.g. MANAGER_OF_SUBMITTER"
												: "Value"
										}
										{...register("approverValue")}
										className={
											errors.approverValue
												? "border-destructive"
												: ""
										}
									/>
									{errors.approverValue && (
										<p className="text-sm text-destructive">
											{errors.approverValue.message}
										</p>
									)}
									<p className="text-xs text-muted-foreground">
										The specific ID, Role Name, or Resolver
										Key.
									</p>
								</div>

								<div className="space-y-2">
									<Label htmlFor="approvalMode">
										Approval Mode
									</Label>
									<Controller
										control={control}
										name="approvalMode"
										render={({ field }) => (
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
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
										)}
									/>
								</div>
							</div>
						</div>

						<div className="pt-6 flex justify-end">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Saving...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Save Step
									</>
								)}
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
