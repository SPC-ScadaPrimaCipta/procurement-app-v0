"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

// Define validation schema
const workflowSchema = z.object({
	code: z
		.string()
		.min(3, "Code must be at least 3 characters")
		.regex(
			/^[A-Z0-9_]+$/,
			"Code must contain only uppercase letters, numbers, and underscores"
		),
	name: z.string().min(3, "Name must be at least 3 characters"),
	description: z.string().optional(),
});

type WorkflowFormValues = z.infer<typeof workflowSchema>;

export default function NewWorkflowPage() {
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Setup form with validation
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<WorkflowFormValues>({
		resolver: zodResolver(workflowSchema),
		defaultValues: {
			code: "",
			name: "",
			description: "",
		},
	});

	async function onSubmit(data: WorkflowFormValues) {
		setIsSubmitting(true);
		try {
			// Include default version and empty steps to satisfy API
			const payload = {
				...data,
				version: 1,
				steps: [], // Creates a workflow with no steps initially
			};

			const res = await fetch("/api/workflows", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				if (res.status === 409) {
					toast.error(
						"Workflow with this code and version already exists"
					);
					return;
				}
				throw new Error("Failed to create workflow");
			}

			const wf = await res.json();
			toast.success("Workflow created successfully");
			// Redirect to the edit/view page for the new workflow
			router.push(`/workflow/definitions/workflows/${wf.workflowId}`);
		} catch (error) {
			console.error(error);
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="max-w-2xl mx-auto py-8 px-4">
			<div className="mb-6">
				<Button
					variant="ghost"
					className="pl-0 hover:pl-2 transition-all"
					asChild
				>
					<Link href="/workflow/definitions/workflows">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Workflows
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-2xl">
						Create New Workflow
					</CardTitle>
					<CardDescription>
						Define the metadata for your new workflow. You can add
						steps after creation.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className="space-y-6"
					>
						<div className="space-y-2">
							<Label htmlFor="code">Workflow Code</Label>
							<Input
								id="code"
								placeholder="e.g. LEAVE_REQUEST"
								{...register("code")}
								className={
									errors.code ? "border-destructive" : ""
								}
							/>
							{errors.code && (
								<p className="text-sm text-destructive">
									{errors.code.message}
								</p>
							)}
							<p className="text-xs text-muted-foreground">
								Unique identifier. Uppercase, numbers, and
								underscores only.
							</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="name">Display Name</Label>
							<Input
								id="name"
								placeholder="e.g. Employee Leave Request"
								{...register("name")}
								className={
									errors.name ? "border-destructive" : ""
								}
							/>
							{errors.name && (
								<p className="text-sm text-destructive">
									{errors.name.message}
								</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">
								Description (Optional)
							</Label>
							<Textarea
								id="description"
								placeholder="Briefly describe the purpose of this workflow..."
								className="min-h-[100px]"
								{...register("description")}
							/>
						</div>

						<div className="flex justify-end pt-4">
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Create Workflow
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
