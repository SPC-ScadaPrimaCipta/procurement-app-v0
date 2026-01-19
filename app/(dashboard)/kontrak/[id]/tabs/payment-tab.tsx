import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatIDR } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Upload, Plus } from "lucide-react";

interface PaymentPlanProps {
	contractId: string;
	contract_payment_plan: Array<{
		id: string;
		line_no: number;
		payment_method: string;
		line_amount: number;
		planned_date: string | null;
		notes: string | null;
		bast: Array<{
			id: string;
			bast_number: string;
			bast_date: string;
			progress_percent: number;
			notes: string;
			document: {
				file_url?: string;
				file_name?: string;
			} | null;
		}>;
	}>;
}

export function PaymentPlanTab({
	contractId,
	contract_payment_plan,
}: PaymentPlanProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Form states
	const [bastNumber, setBastNumber] = useState("");
	const [bastDate, setBastDate] = useState("");
	const [progress, setProgress] = useState("");
	const [notes, setNotes] = useState("");
	const [file, setFile] = useState<File | null>(null);

	// Doc types state
	const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>(
		[]
	);

	useEffect(() => {
		const fetchDocTypes = async () => {
			try {
				const res = await fetch("/api/master/doc-type");
				if (res.ok) {
					const data = await res.json();
					setDocTypes(data);
				}
			} catch (error) {
				console.error("Failed to fetch doc types", error);
			}
		};
		fetchDocTypes();
	}, []);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return format(new Date(dateString), "dd MMM yyyy");
	};

	const handleOpenDialog = (plan: any) => {
		setSelectedPlan(plan);
		setBastNumber("");
		setBastDate(new Date().toISOString().split("T")[0]);
		setProgress("");
		setNotes("");
		setFile(null);
		setIsOpen(true);
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!bastNumber || !bastDate || !progress) {
			toast.error("Mohon lengkapi data wajib.");
			return;
		}

		setIsLoading(true);

		try {
			// 1. Upload file if needed (optional but recommended for BAST)
			let attachmentId = null;
			if (file) {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("refType", "BAST");
				formData.append("refId", contractId);

				const bastDocType = docTypes.find(
					(dt) => dt.name.toUpperCase() === "BAST"
				);
				if (bastDocType) {
					formData.append("doc_type_id", bastDocType.id);
				}
				formData.append("folder_path", `BAST/${contractId}`);

				const uploadRes = await fetch("/api/uploads", {
					method: "POST",
					body: formData,
				});

				if (!uploadRes.ok) throw new Error("Gagal mengupload lampiran");
				const uploadData = await uploadRes.json();
				attachmentId = uploadData.id;
			}

			// 2. Create BAST record
			const res = await fetch("/api/contracts/bast", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contractId,
					paymentPlanId: selectedPlan.id,
					bastNumber,
					bastDate,
					progress: parseFloat(progress),
					notes,
					attachment: attachmentId,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Gagal membuat BAST");
			}

			toast.success("BAST berhasil dibuat");
			setIsOpen(false);
			router.refresh();
		} catch (error: any) {
			toast.error(error.message);
		} finally {
			setIsLoading(false);
		}
	};

	const handleViewBast = (url: string) => {
		window.open(url, "_blank");
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Rencana & Jadwal Pembayaran
					</CardTitle>
					<CardDescription>
						Jadwal pembayaran yang disepakati dalam kontrak
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">Tahap</TableHead>
								<TableHead>Metode</TableHead>
								<TableHead>Tanggal Rencana</TableHead>
								<TableHead className="text-right">
									Nilai (IDR)
								</TableHead>
								<TableHead className="w-[150px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contract_payment_plan.map((item) => {
								const hasBast =
									item.bast && item.bast.length > 0;
								const bastDocUrl = hasBast
									? item.bast[0].document?.file_url
									: null;

								return (
									<TableRow key={item.id}>
										<TableCell className="font-medium text-center">
											{item.line_no}
										</TableCell>
										<TableCell>
											{item.payment_method}
										</TableCell>
										<TableCell>
											{formatDate(item.planned_date)}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatIDR(
												Number(item.line_amount)
											)}
										</TableCell>
										<TableCell>
											{hasBast ? (
												<div className="flex gap-2">
													{bastDocUrl ? (
														<Button
															variant="outline"
															size="sm"
															className="h-8 w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
															onClick={() =>
																handleViewBast(
																	bastDocUrl
																)
															}
														>
															<FileText className="w-3 h-3 mr-1" />
															Lihat BAST
														</Button>
													) : (
														<Button
															variant="outline"
															size="sm"
															className="h-8 w-full border-green-200 bg-green-50 text-green-700"
															disabled
														>
															<FileText className="w-3 h-3 mr-1" />
															Sudah BAST
														</Button>
													)}
												</div>
											) : (
												<Button
													variant="outline"
													size="sm"
													className="h-8 w-full"
													onClick={() =>
														handleOpenDialog(item)
													}
												>
													<Plus className="w-3 h-3 mr-1" />
													Buat BAST
												</Button>
											)}
										</TableCell>
									</TableRow>
								);
							})}
							{contract_payment_plan.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-8 text-muted-foreground"
									>
										Belum ada rencana pembayaran.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Buat Berita Acara (BAST)</DialogTitle>
						<DialogDescription>
							Input data BAST untuk pembayaran tahap{" "}
							{selectedPlan?.line_no}.
						</DialogDescription>
					</DialogHeader>
					<form onSubmit={handleSubmit} className="space-y-4 py-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="bastNumber">Nomor BAST</Label>
								<Input
									id="bastNumber"
									placeholder="No. BAST"
									value={bastNumber}
									onChange={(e) =>
										setBastNumber(e.target.value)
									}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="bastDate">Tanggal</Label>
								<Input
									id="bastDate"
									type="date"
									value={bastDate}
									onChange={(e) =>
										setBastDate(e.target.value)
									}
									required
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="progress">Progress (%)</Label>
							<Input
								id="progress"
								type="number"
								min="0"
								max="100"
								step="0.01"
								placeholder="0 - 100"
								value={progress}
								onChange={(e) => setProgress(e.target.value)}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="notes">Catatan</Label>
							<Textarea
								id="notes"
								placeholder="Keterangan tambahan..."
								value={notes}
								onChange={(e) => setNotes(e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="file">Lampiran Dokumen</Label>
							<Input
								id="file"
								type="file"
								onChange={handleFileChange}
								className="cursor-pointer"
							/>
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsOpen(false)}
								disabled={isLoading}
							>
								Batal
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? "Menyimpan..." : "Simpan BAST"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
