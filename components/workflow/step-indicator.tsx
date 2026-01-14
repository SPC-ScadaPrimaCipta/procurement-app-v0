"use client";

import { CheckCircle2, Circle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface WorkflowStepProps {
	stepNumber: number;
	title: string;
	approverName: string;
	status: "PENDING" | "APPROVED" | "REJECTED" | "SKIPPED";
	approvedAt?: string | Date; // Optional, only if approved/rejected
	isLast?: boolean;
}

export function WorkflowStep({
	stepNumber,
	title,
	approverName,
	status,
	approvedAt,
	isLast = false,
}: WorkflowStepProps) {
	// Determine icon and color based on status
	let Icon = Circle;
	let iconColor = "text-muted-foreground";
	let lineColor = "bg-muted";
	let statusText = "Pending";

	if (status === "APPROVED") {
		Icon = CheckCircle2;
		iconColor = "text-green-600";
		lineColor = "bg-green-600";
		statusText = "Approved";
	} else if (status === "REJECTED") {
		Icon = CheckCircle2; // Or XCircle
		iconColor = "text-red-600";
		lineColor = "bg-red-600"; // Stop line here usually
		statusText = "Rejected";
	} else if (status === "PENDING") {
		Icon = Clock;
		iconColor = "text-amber-500";
		statusText = "Pending";
	}

	return (
		<div className="flex gap-4 relative">
			{/* Timeline Line */}
			{!isLast && (
				<div
					className={cn(
						"absolute left-3.5 top-8 bottom-[-16px] w-0.5",
						status === "APPROVED" ? "bg-green-600" : "bg-muted"
					)}
				/>
			)}

			{/* Icon Column */}
			<div className="flex flex-col items-center">
				<div
					className={cn(
						"z-10 bg-background rounded-full p-1 border",
						status === "APPROVED"
							? "border-green-200"
							: "border-muted"
					)}
				>
					<Icon className={cn("w-5 h-5", iconColor)} />
				</div>
			</div>

			{/* Content Column */}
			<div className="flex-1 pb-6">
				<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
					<div>
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">
							Step {stepNumber}
						</p>
						<h4 className="text-sm font-semibold text-foreground">
							{title}
						</h4>
						<p className="text-sm text-muted-foreground mt-0.5">
							{approverName}
						</p>
					</div>
					<div className="text-right sm:text-right mt-1 sm:mt-0">
						<div
							className={cn(
								"text-xs font-medium inline-flex items-center px-2 py-0.5 rounded-full",
								status === "APPROVED"
									? "bg-green-100 text-green-700"
									: status === "REJECTED"
									? "bg-red-100 text-red-700"
									: "bg-amber-100 text-amber-700"
							)}
						>
							{statusText}
						</div>
						{approvedAt && (
							<p className="text-xs text-muted-foreground mt-1">
								{format(
									new Date(approvedAt),
									"dd MMM yyyy HH:mm"
								)}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
