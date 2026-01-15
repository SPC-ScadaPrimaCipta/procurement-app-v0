"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	ArrowLeft,
	FileText,
	Download,
	Building2,
	Calendar,
	Mail,
	FileIcon,
	Hash,
	User,
	Tag,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkflowActions } from "@/components/workflow/workflow-actions";

interface Document {
	id: string;
	title: string | null;
	doc_number: string | null;
	created_at: string;
	master_doc_type: {
		name: string;
	};
	file_name: string | null;
	file_url: string | null;
	file_size: string | number | null;
}

interface NotaDinasDetail {
	id: string;
	case_id: string;
	agenda_number: string | null;
	received_date: string;
	disposition_date: string | null;
	from_name: string;
	letter_date: string;
	letter_number: string;
	subject: string;
	cc: string | null;
	created_by: string;
	created_at: string;
	currentStepInstanceId?: string | null;
	procurement_case: {
		case_code: string | null;
		status: {
			name: string;
		};
		unit: {
			unit_name: string;
		} | null;
	};
	documents: Document[];
}

export default function NotaDinasDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [data, setData] = useState<NotaDinasDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			if (!id) return;

			try {
				const response = await fetch(`/api/nota-dinas/in/${id}`);
				if (!response.ok) {
					if (response.status === 404)
						throw new Error("Nota Dinas not found");
					throw new Error("Failed to fetch data");
				}

				const result = await response.json();
				setData(result);
			} catch (err: any) {
				setError(err.message || "An error occurred");
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, [id]);

	if (isLoading) {
		return (
			<div className="p-6 space-y-6">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-8 w-8 rounded-full" />
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Skeleton className="h-[200px] w-full" />
					<Skeleton className="h-[200px] w-full" />
					<Skeleton className="h-[200px] w-full" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6">
				<div className="bg-destructive/15 text-destructive p-4 rounded-md border border-destructive/20">
					<h3 className="font-semibold">Error</h3>
					<p>{error}</p>
				</div>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => router.back()}
				>
					<ArrowLeft className="mr-2 h-4 w-4" />
					Go Back
				</Button>
			</div>
		);
	}

	if (!data) return null;

	const statusColor =
		data.procurement_case.status.name === "DRAFT" ? "secondary" : "default";

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Navigation Header */}
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
						<h1 className="text-2xl font-bold tracking-tight text-foreground">
							Detail Surat Masuk
						</h1>
						{/* <p className="text-sm text-muted-foreground flex items-center gap-2">
							<Hash className="w-3 h-3" />
							Case Code:{" "}
							<span className="font-mono text-foreground">
								{data.procurement_case.case_code || "-"}
							</span>
						</p> */}
					</div>
				</div>
				<div className="flex items-center space-x-2">
					<Badge variant={statusColor} className="text-sm px-3 py-1">
						{data.procurement_case.status.name}
					</Badge>
				</div>
			</div>

			<Separator />

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				{/* Left Column: Letter Information (2/3 width) */}
				<div className="md:col-span-2 space-y-6">
					<Card className="overflow-hidden border-t-4 border-t-primary/20">
						<CardHeader className="bg-muted/10">
							<div className="flex items-start justify-between">
								<div>
									<CardTitle className="text-xl">
										Informasi Surat
									</CardTitle>
									<CardDescription>
										Detail utama surat masuk
									</CardDescription>
								</div>
								<Mail className="h-5 w-5 text-muted-foreground" />
							</div>
						</CardHeader>
						<CardContent className="p-6 grid gap-6">
							<div>
								<h3 className="text-sm font-medium text-muted-foreground mb-1">
									Perihal / Subject
								</h3>
								<p className="text-lg font-semibold leading-snug">
									{data.subject}
								</p>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Nomor Surat
									</h3>
									<p className="font-medium">
										{data.letter_number}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Pengirim (Dari)
									</h3>
									<p className="font-medium">
										{data.from_name}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Tanggal Surat
									</h3>
									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-muted-foreground" />
										<span>
											{format(
												new Date(data.letter_date),
												"dd MMMM yyyy"
											)}
										</span>
									</div>
								</div>
								<div>
									<h3 className="text-sm font-medium text-muted-foreground mb-1">
										Diterima Tanggal
									</h3>
									<div className="flex items-center gap-2">
										<Calendar className="w-4 h-4 text-muted-foreground" />
										<span>
											{format(
												new Date(data.received_date),
												"dd MMMM yyyy"
											)}
										</span>
									</div>
								</div>
							</div>

							{data.cc && (
								<div className="mt-2 p-3 bg-muted/20 rounded-md border border-dashed">
									<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
										Tembusan / CC
									</h3>
									<p className="text-sm">{data.cc}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Documents Section */}
					<div className="space-y-4">
						<h2 className="text-lg font-semibold flex items-center gap-2">
							<FileIcon className="w-5 h-5" />
							Lampiran Dokumen
						</h2>
						{data.documents.length === 0 ? (
							<Card className="bg-muted/10 border-dashed">
								<CardContent className="flex flex-col items-center justify-center py-8 text-center">
									<FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
									<p className="text-muted-foreground">
										Tidak ada dokumen lampiran.
									</p>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-3">
								{data.documents.map((doc, idx) => (
									<Card
										key={doc.id}
										className="hover:shadow-sm transition-shadow"
									>
										<CardContent className="p-4 flex items-center justify-between">
											<div className="flex items-center gap-3 overflow-hidden">
												<div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
													<FileText className="h-5 w-5" />
												</div>
												<div className="min-w-0">
													<p className="font-medium truncate">
														{doc.file_name ||
															doc.title ||
															"Dokumen"}
													</p>
													<p className="text-xs text-muted-foreground">
														{
															doc.master_doc_type
																?.name
														}{" "}
														•{" "}
														{format(
															new Date(
																doc.created_at
															),
															"dd MMM yyyy HH:mm"
														)}
													</p>
												</div>
											</div>
											{doc.file_url && (
												<Button
													variant="outline"
													size="sm"
													className="shrink-0 ml-2"
													asChild
												>
													<a
														href={doc.file_url}
														target="_blank"
														rel="noopener noreferrer"
													>
														<Download className="mr-2 h-4 w-4" />
														Download
													</a>
												</Button>
											)}
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Right Column: Meta Info (1/3 width) */}
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Informasi Tambahan
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<span className="text-sm font-medium text-muted-foreground">
									Nomor Agenda
								</span>
								<div className="flex items-center gap-2 mt-1">
									<Tag className="w-4 h-4 text-muted-foreground" />
									<p className="font-medium">
										{data.agenda_number || "-"}
									</p>
								</div>
							</div>

							<Separator />

							<div>
								<span className="text-sm font-medium text-muted-foreground">
									Unit Pemroses
								</span>
								<div className="flex items-center gap-2 mt-1">
									<Building2 className="w-4 h-4 text-muted-foreground" />
									<p className="font-medium">
										{data.procurement_case.unit
											?.unit_name || "-"}
									</p>
								</div>
							</div>

							<Separator />

							<div>
								<span className="text-sm font-medium text-muted-foreground">
									Dibuat Oleh
								</span>
								<div className="flex items-center gap-2 mt-1">
									<User className="w-4 h-4 text-muted-foreground" />
									<p className="font-medium max-w-[150px] truncate">
										{/* Typically we'd fetch the user's name, but here we might have ID or placeholder */}
										{data.created_by}
									</p>
								</div>
								<p className="text-xs text-muted-foreground mt-1 ml-6">
									{format(
										new Date(data.created_at),
										"dd MMM yyyy HH:mm"
									)}
								</p>
							</div>
						</CardContent>
					</Card>

					{/* Actions Card */}
					{/* {data.currentStepInstanceId && (
						<Card className="bg-primary/5 border-primary/20">
							<CardHeader>
								<CardTitle className="text-base text-primary">
									Tindakan Perlu Diselesaikan
								</CardTitle>
								<CardDescription>
									Anda memiliki tugas pending untuk dokumen
									ini.
								</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="flex flex-col gap-2">
									<WorkflowActions
										stepInstanceId={
											data.currentStepInstanceId
										}
										approveLabel="Disposisi / Teruskan"
										sendBackLabel="Kembalikan"
										onSuccess={() => {
											// Refresh data
											const fetchData = async () => {
												if (!id) return;
												try {
													const response =
														await fetch(
															`/api/nota-dinas/in/${id}`
														);
													if (response.ok) {
														const result =
															await response.json();
														setData(result);
													}
												} catch (err) {}
											};
											fetchData();
											router.refresh();
										}}
									/>
								</div>
							</CardContent>
						</Card>
					)} */}
				</div>
			</div>
		</div>
	);
}
