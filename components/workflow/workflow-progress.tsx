"use client";

import { WorkflowStep } from "@/components/workflow/step-indicator";

export interface WorkflowTrackItem {
	stepNumber: number;
	title: string;
	approverName: string;
	status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
	approvedAt?: string | Date | null;
	isLast: boolean;
}

interface WorkflowProgressProps {
	steps: WorkflowTrackItem[];
}

export function WorkflowProgress({ steps }: WorkflowProgressProps) {
	if (!steps || steps.length === 0) {
		return (
			<div className="text-muted-foreground text-sm italic">
				No workflow history available.
			</div>
		);
	}

	return (
		<div className="pl-2">
			{steps.map((step) => (
				<WorkflowStep
					key={step.stepNumber}
					stepNumber={step.stepNumber}
					title={step.title}
					approverName={step.approverName}
					status={step.status}
					approvedAt={
						step.approvedAt ? new Date(step.approvedAt) : undefined
					}
					isLast={step.isLast}
				/>
			))}
		</div>
	);
}
