"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	ArrowLeft,
	Building2,
	Calendar,
	FileText,
	Hash,
	User,
	Mail,
	Send,
	FileCheck,
	Tag,
	Paperclip,
	Download,
	CreditCard,
	Briefcase,
	CheckCircle2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { WorkflowStep } from "@/components/workflow/step-indicator";

interface DocumentFile {
	id: string;
	file_name: string;
	file_url: string | null;
}

interface Document {
	id: string;
	title: string | null;
	doc_number: string | null;
	created_at: string;
	master_doc_type: {
		name: string;
	};
	document_file: DocumentFile[];
}

interface CorrespondenceIn {
	id: string;
	letter_number: string;
	letter_date: string;
	from_name: string;
	subject: string;
	received_date: string;
	created_by_name?: string;
}

interface CorrespondenceOut {
	id: string;
	letter_number: string;
	letter_date: string;
	to_name: string;
	subject: string;
	created_by_name?: string;
}

interface Contract {
	id: string;
	contract_number: string;
	contract_date: string;
	vendor: {
		vendor_name: string;
	} | null;
	contract_value: number;
	start_date: string;
	end_date: string;
	work_description: string;
	contract_status: {
		name: string;
	};
}

interface ProcurementCaseDetail {
	id: string;
	case_code: string | null;
	title: string;
	created_at: string;
	created_by_name: string;
	status: {
		name: string;
	};
	unit: {
		unit_name: string;
	} | null;
	correspondence_in: CorrespondenceIn | null;
	correspondence_out: CorrespondenceOut[];
	contract: Contract | null;
	document: Document[];
	case_disposition_summary: {
		disposition_note: string | null;
		disposition_date: string | null;
	} | null;
}

export default function PengadaanDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [data, setData] = useState<ProcurementCaseDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`/api/procurement-cases/${id}`);
				if (!response.ok) {
					if (response.status === 404)
						throw new Error("Case not found");
					throw new Error("Failed to fetch data");
				}
				const result = await response.json();
				setData(result);
			} catch (err: any) {
				setError(err.message);
			} finally {
				setIsLoading(false);
			}
		};
		if (id) fetchData();
	}, [id]);

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
		correspondence_out,
		contract,
		document: documents,
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
							<Hash className="w-3 h-3" />
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
							<div className="mb-6">
								<div className="flex items-start justify-between gap-4 mb-2">
									<h2 className="text-2xl font-bold leading-tight">
										{title}
									</h2>
									<Badge
										variant={statusVariant}
										className="text-sm px-4 py-1.5 shrink-0"
									>
										{status.name}
									</Badge>
								</div>
								<div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
									<div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
										<Building2 className="w-4 h-4" />
										<span>{unit?.unit_name || "-"}</span>
									</div>
									<div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
										<Calendar className="w-4 h-4" />
										<span>
											{format(
												new Date(created_at),
												"dd MMM yyyy"
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
								{documents.length})
							</TabsTrigger>
						</TabsList>

						<div className="mt-6">
							<TabsContent
								value="surat-masuk"
								className="animate-in fade-in slide-in-from-left-1"
							>
								{correspondence_in ? (
									<Card>
										<CardHeader>
											<CardTitle className="text-lg flex items-center gap-2">
												<Mail className="w-5 h-5 text-primary" />
												Detail Surat Masuk
											</CardTitle>
										</CardHeader>
										<CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">
													Nomor Surat
												</p>
												<p className="font-medium text-base">
													{
														correspondence_in.letter_number
													}
												</p>
											</div>
											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">
													Tanggal Surat
												</p>
												<p className="font-medium text-base">
													{format(
														new Date(
															correspondence_in.letter_date
														),
														"dd MMMM yyyy"
													)}
												</p>
											</div>
											<div className="space-y-1 md:col-span-2">
												<p className="text-sm font-medium text-muted-foreground">
													Pengirim
												</p>
												<p className="font-medium text-base">
													{
														correspondence_in.from_name
													}
												</p>
											</div>
											<div className="space-y-1 md:col-span-2">
												<p className="text-sm font-medium text-muted-foreground">
													Perihal
												</p>
												<div className="p-3 bg-muted/20 rounded-md">
													<p className="font-medium leading-relaxed">
														{
															correspondence_in.subject
														}
													</p>
												</div>
											</div>
											<div className="md:col-span-2 pt-2">
												<Button
													variant="outline"
													size="sm"
													asChild
												>
													<a
														href={`/nota-dinas/surat-masuk/${correspondence_in.id}`}
													>
														Lihat Surat Asli
													</a>
												</Button>
											</div>
										</CardContent>
									</Card>
								) : (
									<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
										<div className="bg-muted p-3 rounded-full mb-3">
											<Mail className="h-6 w-6 text-muted-foreground" />
										</div>
										<p className="text-muted-foreground font-medium">
											Tidak ada data Surat Masuk.
										</p>
									</div>
								)}
							</TabsContent>

							<TabsContent
								value="kontrak"
								className="animate-in fade-in slide-in-from-left-1"
							>
								{contract ? (
									<Card>
										<CardHeader>
											<div className="flex items-center justify-between">
												<CardTitle className="text-lg flex items-center gap-2">
													<Briefcase className="w-5 h-5 text-primary" />
													Informasi Kontrak
												</CardTitle>
												<Badge variant="outline">
													{
														contract.contract_status
															?.name
													}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">
													Nomor Kontrak
												</p>
												<p className="font-mono font-medium">
													{contract.contract_number}
												</p>
											</div>
											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">
													Nilai Kontrak
												</p>
												<p className="font-bold text-lg text-primary">
													{new Intl.NumberFormat(
														"id-ID",
														{
															style: "currency",
															currency: "IDR",
														}
													).format(
														contract.contract_value
													)}
												</p>
											</div>
											<div className="space-y-1 md:col-span-2">
												<p className="text-sm font-medium text-muted-foreground">
													Vendor / Penyedia
												</p>
												<div className="flex items-center gap-2 p-3 border rounded-md bg-muted/10">
													<Building2 className="w-5 h-5 text-muted-foreground" />
													<p className="font-medium">
														{contract.vendor
															?.vendor_name ||
															"-"}
													</p>
												</div>
											</div>
											<div className="space-y-1">
												<p className="text-sm font-medium text-muted-foreground">
													Periode Pelaksanaan
												</p>
												<div className="flex gap-2 items-center">
													<Calendar className="w-4 h-4 text-muted-foreground" />
													<span>
														{format(
															new Date(
																contract.start_date
															),
															"dd MMM yyyy"
														)}
														{" - "}
														{format(
															new Date(
																contract.end_date
															),
															"dd MMM yyyy"
														)}
													</span>
												</div>
											</div>
											<div className="space-y-1 md:col-span-2">
												<p className="text-sm font-medium text-muted-foreground">
													Uraian Pekerjaan
												</p>
												<p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
													{contract.work_description}
												</p>
											</div>
										</CardContent>
									</Card>
								) : (
									<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
										<Briefcase className="h-8 w-8 text-muted-foreground/50 mb-3" />
										<p className="text-muted-foreground mb-4">
											Belum ada kontrak yang dibuat.
										</p>
										<Button variant="outline">
											Buat Kontrak Baru
										</Button>
									</div>
								)}
							</TabsContent>

							<TabsContent
								value="surat-keluar"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<Card>
									<CardHeader>
										<CardTitle className="text-lg">
											Daftar Surat Keluar
										</CardTitle>
									</CardHeader>
									<CardContent className="p-0">
										{correspondence_out.length > 0 ? (
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead className="pl-6">
															No. Surat
														</TableHead>
														<TableHead>
															Tanggal
														</TableHead>
														<TableHead>
															Tujuan
														</TableHead>
														<TableHead>
															Perihal
														</TableHead>
														<TableHead className="pr-6">
															Dibuat
														</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{correspondence_out.map(
														(item) => (
															<TableRow
																key={item.id}
															>
																<TableCell className="pl-6 font-medium">
																	{
																		item.letter_number
																	}
																</TableCell>
																<TableCell>
																	{format(
																		new Date(
																			item.letter_date
																		),
																		"dd/MM/yy"
																	)}
																</TableCell>
																<TableCell>
																	{
																		item.to_name
																	}
																</TableCell>
																<TableCell className="max-w-[180px] truncate">
																	{
																		item.subject
																	}
																</TableCell>
																<TableCell className="pr-6">
																	{item.created_by_name ||
																		"-"}
																</TableCell>
															</TableRow>
														)
													)}
												</TableBody>
											</Table>
										) : (
											<div className="text-center py-12 text-muted-foreground text-sm">
												Tidak ada surat keluar tercatat.
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent
								value="documents"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{documents.map((doc) => (
										<Card
											key={doc.id}
											className="hover:shadow-md transition-all group"
										>
											<CardContent className="p-4 flex items-start justify-between gap-3">
												<div className="flex items-start gap-3 overflow-hidden">
													<div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
														<FileText className="h-5 w-5" />
													</div>
													<div className="min-w-0">
														<p
															className="font-medium truncate text-sm"
															title={
																doc.title ||
																doc
																	.document_file[0]
																	?.file_name
															}
														>
															{doc.title ||
																doc
																	.document_file[0]
																	?.file_name ||
																"Dokumen"}
														</p>
														<div className="flex items-center gap-2 mt-1">
															<Badge
																variant="outline"
																className="text-[10px] h-5 px-1.5 font-normal"
															>
																{
																	doc
																		.master_doc_type
																		.name
																}
															</Badge>
															<span className="text-[10px] text-muted-foreground">
																{format(
																	new Date(
																		doc.created_at
																	),
																	"dd MMM yyyy"
																)}
															</span>
														</div>
													</div>
												</div>
												{doc.document_file[0]
													?.file_url && (
													<Button
														variant="ghost"
														size="icon"
														className="shrink-0 text-muted-foreground hover:text-primary"
														asChild
													>
														<a
															href={
																doc
																	.document_file[0]
																	.file_url
															}
															target="_blank"
															rel="noopener noreferrer"
														>
															<Download className="h-4 w-4" />
														</a>
													</Button>
												)}
											</CardContent>
										</Card>
									))}
								</div>
								{documents.length === 0 && (
									<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
										<FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
										<p className="text-muted-foreground">
											Tidak ada dokumen lampiran.
										</p>
									</div>
								)}
							</TabsContent>
						</div>
					</Tabs>
				</div>

				{/* RIGHT COLUMN: Sidebar (4 cols) */}
				<div className="xl:col-span-4 space-y-6">
					{/* Workflow Progress */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Workflow Progress
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="pl-2">
								<WorkflowStep
									stepNumber={1}
									title="Pengajuan Pengadaan"
									approverName="Staff Pengadaan"
									status="APPROVED"
									approvedAt={
										new Date(
											Date.now() - 1000 * 60 * 60 * 24 * 2
										)
									}
								/>
								<WorkflowStep
									stepNumber={2}
									title="Verifikasi Dokumen"
									approverName="Kasubag Umum"
									status="APPROVED"
									approvedAt={
										new Date(
											Date.now() - 1000 * 60 * 60 * 5
										)
									}
								/>
								<WorkflowStep
									stepNumber={3}
									title="Persetujuan KPA"
									approverName="Kepala Dinas"
									status="PENDING"
									isLast={true}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Status Checklist */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Status Kelengkapan
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y">
								<div className="flex items-center justify-between p-4">
									<div className="flex items-center gap-3">
										<Mail className="w-4 h-4 text-muted-foreground" />
										<span className="text-sm font-medium">
											Nota Dinas
										</span>
									</div>
									{correspondence_in ? (
										<CheckCircle2 className="w-5 h-5 text-green-600" />
									) : (
										<span className="text-xs text-muted-foreground italic">
											Pending
										</span>
									)}
								</div>
								<div className="flex items-center justify-between p-4">
									<div className="flex items-center gap-3">
										<FileCheck className="w-4 h-4 text-muted-foreground" />
										<span className="text-sm font-medium">
											Kontrak
										</span>
									</div>
									{contract ? (
										<CheckCircle2 className="w-5 h-5 text-green-600" />
									) : (
										<span className="text-xs text-muted-foreground italic">
											Pending
										</span>
									)}
								</div>
								<div className="flex items-center justify-between p-4">
									<div className="flex items-center gap-3">
										<Paperclip className="w-4 h-4 text-muted-foreground" />
										<span className="text-sm font-medium">
											Lampiran
										</span>
									</div>
									<Badge
										variant="secondary"
										className="rounded-full px-2"
									>
										{documents.length}
									</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
