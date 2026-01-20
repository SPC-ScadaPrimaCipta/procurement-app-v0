"use client";

import { useEffect, useState } from "react";
import { Loader2, FileText, Trash2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Drag and Drop (simple list reorder for now, effectively "Move Up/Down" buttons or just array logic)
// Since dnd-kit or similar might be heavy, lets stick to simple array manipulation or basic buttons if user asked "On the initial page can reorder".

type RequiredDocumentsSectionProps = {
	workflowId: string;
	stepId: string;
};

type ChecklistItem = {
	id?: string; // Optional for new items
	requirementId?: string; // from DB
	name: string;
	required: boolean;
	mode: "AUTO" | "MANUAL";
	docTypeId: string | null;
	docTypeName?: string;
};

type DocType = {
	id: string;
	name: string;
};

export function RequiredDocumentsSection({
	workflowId,
	stepId,
}: RequiredDocumentsSectionProps) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [requirements, setRequirements] = useState<ChecklistItem[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [docTypes, setDocTypes] = useState<DocType[]>([]);

	// Edit State
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// New Item Form State
	const [newName, setNewName] = useState("");
	const [newDocTypeId, setNewDocTypeId] = useState<string | null>(null); // "null" string or actual null?
	const [newMode, setNewMode] = useState<"AUTO" | "MANUAL">("AUTO");
	const [newRequired, setNewRequired] = useState(true);

	useEffect(() => {
		if (!stepId) return;

		async function fetchRequirements() {
			setLoading(true);
			try {
				// Fetch step details
				const res = await fetch(
					`/api/workflows/${workflowId}/steps/${stepId}`,
				);
				if (!res.ok) throw new Error("Failed to fetch step details");
				const data = await res.json();

				const reqs = data.case_step?.step_requirement || [];

				const mapped = reqs.map((req: any) => ({
					id: req.id,
					requirementId: req.id,
					name: req.name,
					required: req.is_required,
					mode: req.check_mode,
					docTypeId: req.doc_type_id,
					docTypeName: req.doc_type_name,
				}));

				setRequirements(mapped);

				try {
					const dtData = await (
						await fetch("/api/master/doc-type")
					).json(); // Standard guess
					if (Array.isArray(dtData)) setDocTypes(dtData);
				} catch (e) {
					console.warn("Could not fetch doc types", e);
					// Fallback check if master_doc_type table exists (User schema confirms it).
					// But do we have an API?
				}
			} catch (err) {
				console.error(err);
				setError("Failed to load data");
			} finally {
				setLoading(false);
			}
		}

		fetchRequirements();
	}, [workflowId, stepId]);

	const handleAdd = () => {
		if (!newName) {
			toast.error("Name is required");
			return;
		}

		const newItem: ChecklistItem = {
			name: newName,
			docTypeId: newDocTypeId === "none" ? null : newDocTypeId,
			docTypeName:
				docTypes.find((d) => d.id === newDocTypeId)?.name || "",
			mode: newMode,
			required: newRequired,
		};

		setRequirements([...requirements, newItem]);
		setIsDialogOpen(false);
		resetForm();
	};

	const resetForm = () => {
		setNewName("");
		setNewDocTypeId(null);
		setNewMode("AUTO");
		setNewRequired(true);
	};

	const handleRemove = (index: number) => {
		const newReqs = [...requirements];
		newReqs.splice(index, 1);
		setRequirements(newReqs);
	};

	const handleMove = (index: number, direction: "up" | "down") => {
		const newReqs = [...requirements];
		if (direction === "up") {
			if (index === 0) return;
			[newReqs[index - 1], newReqs[index]] = [
				newReqs[index],
				newReqs[index - 1],
			];
		} else {
			if (index === newReqs.length - 1) return;
			[newReqs[index + 1], newReqs[index]] = [
				newReqs[index],
				newReqs[index + 1],
			];
		}
		setRequirements(newReqs);
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const res = await fetch(
				`/api/workflows/${workflowId}/steps/${stepId}/requirements`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ requirements }),
				},
			);

			if (!res.ok) throw new Error("Failed to save requirements");

			toast.success("Requirements updated");
			router.refresh();
		} catch (error) {
			console.error(error);
			toast.error("Failed to save changes");
		} finally {
			setIsSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="py-4 text-center text-sm text-muted-foreground">
				<Loader2 className="inline mr-2 h-4 w-4 animate-spin" /> Loading
				requirements...
			</div>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle className="flex items-center gap-2">
						<FileText className="h-5 w-5" />
						Required Documents & Checks
					</CardTitle>
					<CardDescription>
						Define manual or automatic checks for this step.
					</CardDescription>
				</div>
				<div className="flex items-center gap-2">
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								onClick={resetForm}
							>
								<Plus className="h-4 w-4 mr-2" /> Add Document
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Add Requirement</DialogTitle>
								<DialogDescription>
									Add a new document requirement or checklist
									item.
								</DialogDescription>
							</DialogHeader>

							<div className="space-y-4 py-4">
								<div className="space-y-2">
									<Label>Name</Label>
									<Input
										value={newName}
										onChange={(e) =>
											setNewName(e.target.value)
										}
										placeholder="e.g. Terms of Reference"
									/>
								</div>
								<div className="space-y-2">
									<Label>Document Type (Optional)</Label>
									<Select
										value={newDocTypeId || "none"}
										onValueChange={(val) =>
											setNewDocTypeId(
												val === "none" ? null : val,
											)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder="Select document type" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="none">
												-- None (Manual Check) --
											</SelectItem>
											{docTypes.map((dt) => (
												<SelectItem
													key={dt.id}
													value={dt.id}
												>
													{dt.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<Label>Check Mode</Label>
									<Select
										value={newMode}
										onValueChange={(val: any) =>
											setNewMode(val)
										}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="AUTO">
												Automatic (System Check)
											</SelectItem>
											<SelectItem value="MANUAL">
												Manual (User Verified)
											</SelectItem>
										</SelectContent>
									</Select>
									<p className="text-xs text-muted-foreground">
										Auto: System checks if file exists.
										Manual: User must verify and click
										Pass/Fail.
									</p>
								</div>

								<div className="flex items-center justify-between">
									<Label>Is Required?</Label>
									<Switch
										checked={newRequired}
										onCheckedChange={setNewRequired}
									/>
								</div>
							</div>

							<DialogFooter>
								<Button onClick={handleAdd}>Add Item</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>

					<Button
						size="sm"
						onClick={handleSaveChanges}
						disabled={isSaving}
					>
						{isSaving && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Save Order & Changes
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				{requirements.length === 0 ? (
					<div className="text-sm text-muted-foreground italic text-center py-8 border border-dashed rounded-md">
						No requirements added yet.
					</div>
				) : (
					<div className="space-y-2">
						{requirements.map((req, idx) => (
							<div
								key={idx}
								className="flex items-center gap-3 p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors group"
							>
								<div className="flex flex-col gap-1 text-muted-foreground">
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										disabled={idx === 0}
										onClick={() => handleMove(idx, "up")}
									>
										<span className="sr-only">Move Up</span>
										<svg
											width="10"
											height="10"
											viewBox="0 0 15 15"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645L11.8536 6.14645C12.0488 6.34171 12.0488 6.65829 11.8536 6.85355C11.6583 7.04882 11.3417 7.04882 11.1464 6.85355L7.5 3.20711L3.85355 6.85355C3.65829 7.04882 3.34171 7.04882 3.14645 6.85355C2.95118 6.65829 2.95118 6.34171 3.14645 6.14645L7.14645 2.14645Z"
												fill="currentColor"
												fillRule="evenodd"
												clipRule="evenodd"
											></path>
										</svg>
									</Button>
									<Button
										variant="ghost"
										size="icon"
										className="h-6 w-6"
										disabled={
											idx === requirements.length - 1
										}
										onClick={() => handleMove(idx, "down")}
									>
										<span className="sr-only">
											Move Down
										</span>
										<svg
											width="10"
											height="10"
											viewBox="0 0 15 15"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M7.5 11.7929L3.85355 8.14645C3.65829 7.95118 3.34171 7.95118 3.14645 8.14645C2.95118 8.34171 2.95118 8.65829 3.14645 8.85355L7.14645 12.8536C7.34171 13.0488 7.65829 13.0488 7.85355 12.8536L11.8536 8.85355C12.0488 8.65829 12.0488 8.34171 11.8536 8.14645C11.6583 7.95118 11.3417 7.95118 11.1464 8.14645L7.5 11.7929Z"
												fill="currentColor"
												fillRule="evenodd"
												clipRule="evenodd"
											></path>
										</svg>
									</Button>
								</div>
								<div className="flex-1">
									<div className="flex items-center gap-2 mb-1">
										<span className="font-medium text-sm">
											{req.name}
										</span>
										{req.required && (
											<Badge className="text-[10px] h-4 px-1">
												Required
											</Badge>
										)}
										<Badge
											variant="outline"
											className="text-[10px] h-4 px-1"
										>
											{req.mode}
										</Badge>
									</div>
									<div className="text-xs text-muted-foreground">
										{req.docTypeName
											? `Linked: ${req.docTypeName}`
											: "No Item Type Linked"}
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="text-destructive hover:text-destructive hover:bg-destructive/10"
									onClick={() => handleRemove(idx)}
								>
									<Trash2 className="h-4 w-4" />
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
