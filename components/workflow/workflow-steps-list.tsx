"use client";

import { useState } from "react";
import {
	GitBranch,
	Plus,
	User,
	Users,
	ArrowUp,
	ArrowDown,
	Trash2,
	CheckSquare,
	RotateCcw,
	Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AddStepDialog, DraftStep } from "./add-step-dialog";

export type Step = {
	id?: string;
	tempId?: string;
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
};

type WorkflowStepsListProps = {
	workflowId: string;
	steps: Step[];
	onAddStep: (step: Step) => void;
	onDeleteStep: (index: number) => void;
	onMoveStep: (index: number, direction: "up" | "down") => void;
};

export function WorkflowStepsList({
	workflowId,
	steps,
	onAddStep,
	onDeleteStep,
	onMoveStep,
}: WorkflowStepsListProps) {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const handleAddStep = (draft: DraftStep) => {
		onAddStep({
			...draft,
			// map draft fields to Step if needed, they match mostly
		});
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<div>
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<GitBranch className="h-5 w-5 text-primary" />
						Workflow Steps
					</h2>
					<p className="text-muted-foreground text-sm">
						The sequential approval process for this workflow.
					</p>
				</div>
				<Button onClick={() => setIsDialogOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Step
				</Button>
			</div>

			<AddStepDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				onAddStep={handleAddStep}
				nextOrder={steps.length + 1}
			/>

			<div className="relative pl-6 space-y-8">
				{/* Vertical Line Container */}
				<div className="absolute left-6 top-28 bottom-16 w-px bg-border -z-10" />

				{steps.length === 0 && (
					<div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
						No steps defined yet. Click "Add Step" to start.
					</div>
				)}

				{steps.map((step, index) => (
					<div key={index} className="relative pl-8">
						{/* Connector Dot */}
						<div
							className={`absolute left-0 top-1/2 rounded-full border-4 border-background bg-primary w-5 h-5 -ml-2.5`}
						/>

						<Card className="group relative transition-all hover:shadow-md border-muted-foreground/20">
							<CardContent className="p-5 flex items-start gap-4">
								{/* Step Order Circle */}
								<div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
									{step.step_order}
								</div>

								<div className="flex-1 space-y-1">
									<div className="flex items-center justify-between">
										<h3 className="font-semibold text-lg">
											{step.name}
										</h3>
										<div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() =>
													onMoveStep(
														step.step_order - 1,
														"up"
													)
												}
												disabled={step.step_order === 1}
											>
												<ArrowUp className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() =>
													onMoveStep(
														step.step_order - 1,
														"down"
													)
												}
												disabled={
													step.step_order ===
													steps.length
												}
											>
												<ArrowDown className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() =>
													onDeleteStep(
														step.step_order - 1
													)
												}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
									<p className="text-xs font-mono text-muted-foreground bg-muted inline-block px-1.5 py-0.5 rounded">
										KEY: {step.step_key}
									</p>

									<div className="grid grid-cols-2 gap-4 mt-3 text-sm">
										<div className="flex items-center gap-2 text-muted-foreground">
											<Users className="h-4 w-4" />
											<span>Approver Category:</span>
											<span className="font-medium text-foreground">
												{step.approver_strategy}
											</span>
										</div>
										<div className="flex items-center gap-2 text-muted-foreground">
											<User className="h-4 w-4" />
											{/* <span>Value:</span> */}
											<div className="flex flex-wrap gap-1">
												{(
													step.approver_label ||
													step.approver_value
												)
													.split(",")
													.map((val, idx) => (
														<Badge
															key={idx}
															variant="secondary"
															className="px-1.5 py-0 h-5 font-normal"
														>
															{val.trim()}
														</Badge>
													))}
											</div>
										</div>

										<div className="flex items-center gap-2 text-muted-foreground">
											<CheckSquare className="h-4 w-4" />
											<span>Approval Mode:</span>
											<span className="font-medium text-foreground">
												{step.approval_mode}
											</span>
										</div>

										<div className="flex items-center gap-2 text-muted-foreground">
											{step.can_send_back ? (
												<>
													<RotateCcw className="h-4 w-4" />
													<span>Sendback Mode:</span>
													<span className="font-medium text-foreground">
														{step.reject_target_type ===
														"SPECIFIC"
															? (() => {
																	const target =
																		steps.find(
																			(
																				s
																			) =>
																				s.id ===
																					step.reject_target_step_id ||
																				s.tempId ===
																					step.reject_target_step_id
																		);
																	return target
																		? `Step: ${target.name}`
																		: "Unknown Step";
															  })()
															: step.reject_target_type}
													</span>
												</>
											) : (
												<>
													<Ban className="h-4 w-4" />
													<span className="font-medium text-foreground">
														Cannot send back
													</span>
												</>
											)}
										</div>
									</div>
								</div>

								{/* {step.is_terminal && (
									<div className="absolute top-0 right-0 p-2">
										<Badge variant="destructive">
											Terminal
										</Badge>
									</div>
								)} */}
							</CardContent>
						</Card>
					</div>
				))}

				{/* End Node Visual */}
				{/* {steps.length > 0 && (
					<div className="relative pl-8 pt-2">
						<div className="absolute left-0 -ml-2 top-3 w-4 h-4 rounded-full bg-muted border-2 border-background" />
						<p className="text-xs text-muted-foreground italic">
							End of Workflow
						</p>
					</div>
				)} */}
			</div>
		</div>
	);
}
