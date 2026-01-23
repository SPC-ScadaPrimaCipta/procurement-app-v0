"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	ArrowLeft,
	Building2,
	Calendar,
	Hash,
	User,
	Mail,
	Send,
	FileCheck,
	Paperclip,
	CheckCircle2,
	FileText,
	Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkflowActions } from "@/components/workflow/workflow-actions";
import { WorkflowProgress } from "@/components/workflow/workflow-progress";
import {
	ChecklistCard,
	ChecklistData,
} from "@/components/checklist/checklist-card";

import { ProcurementCaseDetail } from "./types";
import { TabSuratMasuk } from "./tab-surat-masuk";
import { TabKontrak } from "./tab-kontrak";
import { TabSuratKeluar } from "./tab-surat-keluar";
import { TabDocuments } from "./tab-documents";
import { StatusUpdateDialog } from "@/components/dashboard/procurement/status-update-dialog";

export default function PengadaanDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [data, setData] = useState<ProcurementCaseDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [nextStepTitle, setNextStepTitle] = useState<string | null>(null);
	const [checklist, setChecklist] = useState<ChecklistData | null>(null);
	const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

	const fetchData = async () => {
		try {
			setIsLoading(true);
			const response = await fetch(`/api/procurement-cases/${id}`);
			if (!response.ok) {
				if (response.status === 404) throw new Error("Case not found");
				throw new Error("Failed to fetch data");
			}
			const result = await response.json();
			setData(result);

			// Determine next step title for forward label
			if (result.workflow_track) {
				const pendingIndex = result.workflow_track.findIndex(
					(step: any) => step.status === "PENDING",
				);
				if (pendingIndex !== -1) {
					setNextStepTitle(
						result.workflow_track[pendingIndex + 1]?.title ||
							"Approve",
					);
				} else {
					setNextStepTitle(null);
				}
			}

			// Fetch checklist
			try {
				const stepParam = result.currentStepInstanceId
					? `workflowStepInstanceId=${result.currentStepInstanceId}`
					: "";
				const clRes = await fetch(
					`/api/procurement-cases/${id}/checklist?includeDocs=true&${stepParam}`,
				);
				if (clRes.ok) {
					const clData = await clRes.json();
					setChecklist(clData);
				}
			} catch (e) {
				console.error("Failed to fetch checklist", e);
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (id) fetchData();
	}, [id]);

	const handleForward = async (action: "approve" | "sendback") => {
		if (action === "approve") {
			try {
				// Forward the case
				const res = await fetch(
					`/api/procurement-cases/${id}/forward`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							remarks: "",  // Optional: bisa diisi jika ada comment
						}),
					},
				);
				if (!res.ok) {
					const errorText = await res.text();
					console.error("Failed to forward case:", errorText);
					return false;
				}
				
				const result = await res.json();
				console.log("✅ Forward successful:", result);
				
				return true;
			} catch (error) {
				console.error("Error forwarding case:", error);
				return false;
			}
		}
		return true;
	};

	if (isLoading) {
		return (
			<div className="p-6 space-y-6">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-10 w-10 rounded-full" />
					<Skeleton className="h-10 w-[200px]" />
				</div>
				<Skeleton className="h-[200px] w-full" />
				<Skeleton className="h-[200px] w-full" />
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="p-6">
				<div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20 mb-4">
					<h3 className="font-semibold">Error</h3>
					<p>{error || "Data not found"}</p>
				</div>
				<Button variant="outline" onClick={() => router.back()}>
					<ArrowLeft className="mr-2 h-4 w-4" /> Go Back
				</Button>
			</div>
		);
	}

	const {
		case_code,
		title,
		status,
		unit,
		created_by_name,
		created_at,
		correspondence_in,
		contract,
		documents,
	} = data;

	const statusVariant =
		status.name === "APPROVED"
			? "default"
			: status.name === "REJECTED"
				? "destructive"
				: "secondary";

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Top Header Section */}
			<div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => router.back()}
					>
						<ArrowLeft className="h-5 w-5" />
					</Button>
					<div>
						<h1 className="text-xl font-bold tracking-tight text-foreground">
							Detail Pengadaan
						</h1>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							{/* <Hash className="w-3 h-3" /> */}
							<span className="font-mono">
								{case_code || "No Code"}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
				{/* LEFT COLUMN: Main Content (8 cols) */}
				<div className="xl:col-span-8 space-y-6">
					{/* Hero Card: Title & Key Meta */}
					<Card className="border-l-4 border-l-primary/40">
						<CardContent className="p-6">
							<div className="">
								<div className="flex items-start justify-between gap-4 mb-2">
									<h2 className="text-2xl font-bold leading-tight">
										{title}
									</h2>
									<div className="flex items-center gap-2">
										<Badge
											variant={statusVariant}
											className="text-sm px-4 py-1.5 shrink-0"
										>
											{status.name}
										</Badge>
										{data?.currentStepInstanceId && (
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-muted-foreground hover:text-foreground"
												onClick={() =>
													setIsStatusDialogOpen(true)
												}
											>
												<Pencil className="w-3.5 h-3.5" />
											</Button>
										)}
									</div>
								</div>
								<div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
									{/* <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
										<Building2 className="w-4 h-4" />
										<span>{unit?.unit_name || "-"}</span>
									</div> */}
									<div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
										<Calendar className="w-4 h-4" />
										<span>
											{format(
												new Date(created_at),
												"dd MMM yyyy",
											)}
										</span>
									</div>
									<div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
										<User className="w-4 h-4" />
										<span>{created_by_name}</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Detail TABS */}
					<Tabs defaultValue="surat-masuk" className="w-full">
						<TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
							<TabsTrigger
								value="surat-masuk"
								className="gap-2 py-2"
							>
								<Mail className="w-4 h-4" /> Surat Masuk
							</TabsTrigger>
							<TabsTrigger value="kontrak" className="gap-2 py-2">
								<FileCheck className="w-4 h-4" /> Kontrak
							</TabsTrigger>
							<TabsTrigger
								value="surat-keluar"
								className="gap-2 py-2"
							>
								<Send className="w-4 h-4" /> Surat Keluar
							</TabsTrigger>
							<TabsTrigger
								value="documents"
								className="gap-2 py-2"
							>
								<Paperclip className="w-4 h-4" /> Lampiran (
								{documents?.length || 0})
							</TabsTrigger>
						</TabsList>

						<div className="mt-6">
							<TabsContent
								value="surat-masuk"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<TabSuratMasuk
									data={data}
									onDataChange={fetchData}
								/>
							</TabsContent>

							<TabsContent
								value="kontrak"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<TabKontrak
									data={data}
									onDataChange={fetchData}
								/>
							</TabsContent>

							<TabsContent
								value="surat-keluar"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<TabSuratKeluar data={data} />
							</TabsContent>

							<TabsContent
								value="documents"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<TabDocuments data={data} />
							</TabsContent>
						</div>
					</Tabs>
				</div>

				{/* RIGHT COLUMN: Sidebar (4 cols) */}
				<div className="xl:col-span-4 space-y-6">
					{/* Workflow Actions Card */}
					{data?.currentStepInstanceId && (
						<Card className="border-l-4 border-l-blue-500 shadow-md bg-blue-50/50 dark:bg-blue-950/20">
							<CardHeader className="pb-3">
								<CardTitle className="text-base flex items-center gap-2">
									<CheckCircle2 className="w-5 h-5 text-blue-600" />
									Tindakan Diperlukan
								</CardTitle>
								<CardDescription>
									Anda memiliki tugas pending.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<WorkflowActions
									stepInstanceId={data.currentStepInstanceId}
									disabled={false}
									onSuccess={() => {
										window.location.reload();
									}}
									onBeforeAction={handleForward}
									approveLabel={
										nextStepTitle?.includes("Approve")
											? "Approve"
											: nextStepTitle
												? `Forward ke ${nextStepTitle}`
												: "Forward"
									}
									sendBackLabel="Kembali ke Satker"
								/>
							</CardContent>
						</Card>
					)}

					{/* Status Checklist */}
					<ChecklistCard
						checklist={checklist}
						onUploadDocType={(dtId) =>
							console.log("Upload doc type", dtId)
						}
						caseId={id}
						caseCode={case_code || ""}
						onRefresh={fetchData}
						canVerify={data?.currentStepInstanceId ? true : false}
					/>

					{/* Workflow Progress */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Workflow Progress
							</CardTitle>
						</CardHeader>
						<CardContent>
							<WorkflowProgress
								steps={data?.workflow_track || []}
							/>
						</CardContent>
					</Card>
				</div>
			</div>

			<StatusUpdateDialog
				isOpen={isStatusDialogOpen}
				onClose={() => setIsStatusDialogOpen(false)}
				caseId={id}
				currentStatusId={status.id}
				onSuccess={fetchData}
			/>
		</div>
	);
}
