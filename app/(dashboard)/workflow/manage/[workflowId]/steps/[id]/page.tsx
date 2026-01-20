"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/auth"; // Note: this is client, but auth import might be dangerous if not client-safe.
// Usually we fetch from API.
import { StepDetailForm } from "@/components/workflow/step-detail-form";
import { notFound, useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function StepDetailPage() {
	const params = useParams();
	const workflowId = params.workflowId as string;
	const stepId = params.id as string;

	const [step, setStep] = useState<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function fetchStep() {
			setLoading(true);
			try {
				const res = await fetch(
					`/api/workflows/${workflowId}/steps/${stepId}`,
				);
				if (!res.ok) {
					if (res.status === 404) {
						setError("Not Found");
					} else {
						setError("Failed to load step");
					}
					return;
				}
				const data = await res.json();
				setStep(data);
			} catch (err) {
				console.error(err);
				setError("Error loading step");
			} finally {
				setLoading(false);
			}
		}

		if (workflowId && stepId) {
			fetchStep();
		}
	}, [workflowId, stepId]);

	if (loading) {
		return (
			<div className="flex items-center justify-center p-12">
				<Loader2 className="animate-spin mr-2" /> Loading step
				details...
			</div>
		);
	}

	if (error === "Not Found") {
		return <div className="p-8 text-center">Step not found.</div>;
	}

	if (error || !step) {
		return (
			<div className="p-8 text-center text-destructive">
				Error: {error}
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto py-8">
			<h1 className="text-2xl font-bold mb-6">Edit Step: {step.name}</h1>
			<StepDetailForm workflowId={workflowId} initialStep={step} />
		</div>
	);
}
