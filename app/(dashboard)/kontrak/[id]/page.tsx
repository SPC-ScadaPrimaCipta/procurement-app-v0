"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
	ArrowLeft,
	Briefcase,
	Building2,
	Calendar,
	CheckSquare,
	CreditCard,
	FileCheck,
	FileText,
	Hash,
	User,
	Download,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Interfaces ---
interface ContractDetail {
	id: string;
	contract_number: string;
	contract_date: string;
	start_date: string;
	end_date: string;
	contract_value: number; // Decimal in DB, number in JSON
	work_description: string;
	vendor: {
		vendor_name: string;
		address?: string;
	} | null;
	contract_status: {
		name: string;
	};
	procurement_case: {
		id: string;
		title: string;
		case_code: string;
		document: Array<{
			id: string;
			title: string;
			created_at: string;
			master_doc_type: { name: string };
			document_file: Array<{
				file_name: string;
				file_url: string;
			}>;
		}>;
	};
	contract_payment_plan: Array<{
		id: string;
		line_no: number;
		payment_method: string;
		line_amount: number;
		planned_date: string | null;
		notes: string | null;
	}>;
	bast: Array<{
		id: string;
		bast_type: string;
		bast_number: string;
		bast_date: string;
		progress_percent: number;
		notes: string;
	}>;
	created_by_name: string;
}

export default function ContractDetailPage() {
	const params = useParams();
	const router = useRouter();
	const id = params.id as string;

	const [data, setData] = useState<ContractDetail | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			if (!id) return;
			try {
				const response = await fetch(`/api/contracts/${id}`);
				if (!response.ok) {
					if (response.status === 404)
						throw new Error("Contract not found");
					throw new Error("Failed to fetch contract details");
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
			<div className="md:p-6 space-y-6">
				<div className="flex items-center space-x-4">
					<Skeleton className="h-10 w-10 rounded-md" />
					<div className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-32" />
					</div>
				</div>
				<div className="grid gap-6 md:grid-cols-3">
					<Skeleton className="h-[200px] md:col-span-2" />
					<Skeleton className="h-[200px]" />
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="flex flex-col items-center justify-center p-12 text-center">
				<div className="rounded-full bg-red-100 p-3 mb-4">
					<FileText className="h-6 w-6 text-red-600" />
				</div>
				<h3 className="text-lg font-semibold text-red-900">
					Error Loading Contract
				</h3>
				<p className="text-sm text-red-700 mt-1 max-w-sm">{error}</p>
				<Button
					variant="outline"
					className="mt-4"
					onClick={() => router.back()}
				>
					<ArrowLeft className="mr-2 h-4 w-4" /> Go Back
				</Button>
			</div>
		);
	}

	const {
		contract_number,
		contract_date,
		start_date,
		end_date,
		contract_value,
		work_description,
		vendor,
		contract_status,
		procurement_case,
		contract_payment_plan,
		bast,
		created_by_name,
	} = data;

	const formatCurrency = (val: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
		}).format(val);
	};

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return format(new Date(dateString), "dd MMM yyyy");
	};

	const statusVariant =
		contract_status.name === "Aktif" || contract_status.name === "Active"
			? "default"
			: contract_status.name === "Terminated"
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
							Detail Kontrak
						</h1>
						<div className="flex items-center gap-2 text-sm text-muted-foreground">
							<Hash className="w-3 h-3" />
							<span className="font-mono">
								{contract_number || "No Contract Number"}
							</span>
						</div>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button variant="outline" size="sm" asChild>
						<a href={`/pengadaan/${procurement_case.id}`}>
							Lihat Pengadaan
						</a>
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
				{/* LEFT COLUMN: Main Content (8 cols) */}
				<div className="xl:col-span-8 space-y-6">
					{/* Hero Card */}
					<Card className="border-l-4 border-l-primary/40">
						<CardContent className="p-6">
							<div className="mb-6">
								<div className="flex items-start justify-between gap-4 mb-2">
									<div className="space-y-1">
										<p className="text-sm font-medium text-muted-foreground">
											Nama Vendor / Penyedia
										</p>
										<h2 className="text-2xl font-bold leading-tight flex items-center gap-2">
											<Building2 className="w-6 h-6 text-primary" />
											{vendor?.vendor_name || "-"}
										</h2>
									</div>
									<Badge
										variant={statusVariant}
										className="text-sm px-4 py-1.5 shrink-0"
									>
										{contract_status.name}
									</Badge>
								</div>
								<Separator className="my-4" />
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">
											Judul Pengadaan
										</p>
										<p className="font-medium">
											{procurement_case.title}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">
											Nilai Kontrak
										</p>
										<p className="font-bold text-lg text-primary">
											{formatCurrency(contract_value)}
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Detail TABS */}
					<Tabs defaultValue="detail" className="w-full">
						<TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-muted/50">
							<TabsTrigger value="detail" className="gap-2 py-2">
								<FileText className="w-4 h-4" /> Informasi Umum
							</TabsTrigger>
							<TabsTrigger value="payment" className="gap-2 py-2">
								<CreditCard className="w-4 h-4" /> Rencana
								Pembayaran
							</TabsTrigger>
							<TabsTrigger value="bast" className="gap-2 py-2">
								<CheckSquare className="w-4 h-4" /> BAST
							</TabsTrigger>
							<TabsTrigger
								value="documents"
								className="gap-2 py-2"
							>
								<Briefcase className="w-4 h-4" /> Dokumentasi
							</TabsTrigger>
						</TabsList>

						<div className="mt-6">
							<TabsContent
								value="detail"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Detail Kontrak
										</CardTitle>
									</CardHeader>
									<CardContent className="space-y-6">
										<div className="grid md:grid-cols-2 gap-6">
											<div className="space-y-1">
												<p className="text-sm text-muted-foreground">
													Nomor Kontrak
												</p>
												<p className="font-medium">
													{contract_number}
												</p>
											</div>
											<div className="space-y-1">
												<p className="text-sm text-muted-foreground">
													Tanggal Tanda Tangan
												</p>
												<p className="font-medium">
													{formatDate(contract_date)}
												</p>
											</div>
											<div className="space-y-1">
												<p className="text-sm text-muted-foreground">
													Mulai Pelaksanaan
												</p>
												<p className="font-medium">
													{formatDate(start_date)}
												</p>
											</div>
											<div className="space-y-1">
												<p className="text-sm text-muted-foreground">
													Selesai Pelaksanaan
												</p>
												<p className="font-medium">
													{formatDate(end_date)}
												</p>
											</div>
										</div>
										<Separator />
										<div className="space-y-2">
											<p className="text-sm text-muted-foreground">
												Uraian Pekerjaan
											</p>
											<div className="bg-muted/10 p-4 rounded-md border text-sm whitespace-pre-wrap leading-relaxed">
												{work_description}
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent
								value="payment"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Rencana & Jadwal Pembayaran
										</CardTitle>
										<CardDescription>
											Jadwal pembayaran yang disepakati
											dalam kontrak
										</CardDescription>
									</CardHeader>
									<CardContent className="p-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead className="w-[80px]">
														Tahap
													</TableHead>
													<TableHead>
														Metode
													</TableHead>
													<TableHead>
														Tanggal Rencana
													</TableHead>
													<TableHead className="text-right">
														Nilai (IDR)
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{contract_payment_plan.map(
													(item) => (
														<TableRow key={item.id}>
															<TableCell className="font-medium text-center">
																{item.line_no}
															</TableCell>
															<TableCell>
																{
																	item.payment_method
																}
															</TableCell>
															<TableCell>
																{formatDate(
																	item.planned_date
																)}
															</TableCell>
															<TableCell className="text-right font-medium">
																{formatCurrency(
																	Number(
																		item.line_amount
																	)
																)}
															</TableCell>
														</TableRow>
													)
												)}
												{contract_payment_plan.length ===
													0 && (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center py-8 text-muted-foreground"
														>
															Belum ada rencana
															pembayaran.
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent
								value="bast"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Berita Acara Serah Terima (BAST)
										</CardTitle>
										<CardDescription>
											Riwayat serah terima pekerjaan
										</CardDescription>
									</CardHeader>
									<CardContent className="p-0">
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>
														No. BAST
													</TableHead>
													<TableHead>
														Tanggal
													</TableHead>
													<TableHead>Tipe</TableHead>
													<TableHead className="text-right">
														Progress
													</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{bast.map((item) => (
													<TableRow key={item.id}>
														<TableCell className="font-medium">
															{item.bast_number ||
																"-"}
														</TableCell>
														<TableCell>
															{formatDate(
																item.bast_date
															)}
														</TableCell>
														<TableCell>
															<Badge variant="outline">
																{item.bast_type}
															</Badge>
														</TableCell>
														<TableCell className="text-right font-medium">
															{
																item.progress_percent
															}
															%
														</TableCell>
													</TableRow>
												))}
												{bast.length === 0 && (
													<TableRow>
														<TableCell
															colSpan={4}
															className="text-center py-8 text-muted-foreground"
														>
															Belum ada data BAST.
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent
								value="documents"
								className="animate-in fade-in slide-in-from-left-1"
							>
								<Card>
									<CardHeader>
										<CardTitle className="text-base">
											Dokumen Terkait
										</CardTitle>
										<CardDescription>
											Dokumen dari pengadaan{" "}
											{procurement_case.case_code}
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											{procurement_case.document.map(
												(doc) => (
													<div
														key={doc.id}
														className="flex items-start justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
													>
														<div className="flex items-start gap-3 overflow-hidden">
															<div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
																<FileText className="h-4 w-4" />
															</div>
															<div className="min-w-0">
																<p className="text-sm font-medium truncate">
																	{doc.title ||
																		doc
																			.document_file[0]
																			?.file_name ||
																		"Dokumen"}
																</p>
																<div className="flex items-center gap-2 mt-1">
																	<Badge
																		variant="outline"
																		className="text-[10px] h-4 px-1 font-normal"
																	>
																		{
																			doc
																				.master_doc_type
																				.name
																		}
																	</Badge>
																	<span className="text-[10px] text-muted-foreground">
																		{formatDate(
																			doc.created_at
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
																className="h-8 w-8 shrink-0"
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
																	<Download className="h-4 w-4 text-muted-foreground" />
																</a>
															</Button>
														)}
													</div>
												)
											)}
											{procurement_case.document
												.length === 0 && (
												<div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
													<FileText className="h-8 w-8 mb-2 opacity-50" />
													<p>
														Tidak ada dokumen
														tersedia.
													</p>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</div>
					</Tabs>
				</div>

				{/* RIGHT COLUMN: Sidebar (4 cols) */}
				<div className="xl:col-span-4 space-y-6">
					{/* Contract Summary Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Ringkasan Durasi
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center text-sm">
								<span className="text-muted-foreground">
									Tanggal Mulai
								</span>
								<span className="font-medium">
									{formatDate(start_date)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm">
								<span className="text-muted-foreground">
									Tanggal Selesai
								</span>
								<span className="font-medium">
									{formatDate(end_date)}
								</span>
							</div>
							<div className="flex justify-between items-center text-sm pt-4 border-t">
								<span className="font-medium">Sisa Waktu</span>
								<Badge variant="secondary">
									{Math.max(
										0,
										Math.ceil(
											(new Date(end_date).getTime() -
												new Date().getTime()) /
												(1000 * 60 * 60 * 24)
										)
									)}{" "}
									Hari
								</Badge>
							</div>
						</CardContent>
					</Card>

					{/* Additional Info / Contact */}
					<Card>
						<CardHeader>
							<CardTitle className="text-base">
								Informasi Kontak
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-start gap-3">
								<User className="w-4 h-4 text-muted-foreground mt-0.5" />
								<div>
									<p className="text-sm font-medium">
										Dibuat Oleh
									</p>
									<p className="text-sm text-muted-foreground">
										{created_by_name}
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
