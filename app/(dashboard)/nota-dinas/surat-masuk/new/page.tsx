"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Send, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { validateMicrosoftSession } from "@/lib/utils";
import { matchMultiple } from "@/lib/fuzzy-match";
import { convertPdfToImage } from "@/lib/pdf-to-image";
import {
	DispositionSection,
	DispositionData,
} from "@/components/disposition/disposition-section";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function NewSuratMasukPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [ocrLoading, setOcrLoading] = useState(false);

	// Form State
	const [formData, setFormData] = useState({
		from_name: "",
		letter_date: "",
		letter_number: "",
		subject: "",
		cc: "",
	});

	const [dispositionData, setDispositionData] = useState<DispositionData>({
		agenda_scope: "Biro",
		agenda_number: "",
		disposition_date: new Date().toISOString().split("T")[0],
		disposition_actions: [],
		forward_to_ids: [],
		disposition_note: "",
	});

	// File State (separating them for clear handling)
	const [files, setFiles] = useState<{
		notaDinas: File | null;
		tor: File | null;
		rab: File | null;
	}>({
		notaDinas: null,
		tor: null,
		rab: null,
	});

	const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>(
		[]
	);
	const [masterActions, setMasterActions] = useState<any[]>([]);
	const [masterRecipients, setMasterRecipients] = useState<any[]>([]);

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

	useEffect(() => {
		const fetchMasters = async () => {
			try {
				const [actionsRes, recipientsRes] = await Promise.all([
					fetch("/api/master/disposition-action"),
					fetch("/api/master/disposition-recipient"),
				]);
				if (actionsRes.ok) setMasterActions(await actionsRes.json());
				if (recipientsRes.ok)
					setMasterRecipients(await recipientsRes.json());
			} catch (e) {
				console.error("Failed to load master disposition data", e);
			}
		};
		fetchMasters();
	}, []);

	useEffect(() => {
		validateMicrosoftSession(router);
	}, [router]);

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleFileChange =
		(key: keyof typeof files) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files[0]) {
				setFiles((prev) => ({ ...prev, [key]: e.target.files![0] }));
			}
		};

	// Convert DD/MM/YYYY to YYYY-MM-DD for date input
	const convertDateFormat = (ddmmyyyy: string): string => {
		if (!ddmmyyyy || ddmmyyyy === "null") return "";
		const parts = ddmmyyyy.split("/");
		if (parts.length === 3) {
			const [day, month, year] = parts;
			return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
		}
		return "";
	};

	const handleProcessOCR = async () => {
		if (!files.notaDinas) {
			toast.error("Pilih file Nota Dinas terlebih dahulu");
			return;
		}

		setOcrLoading(true);

		try {
			let fileToProcess = files.notaDinas;

			// Convert PDF to image if needed (client-side)
			if (files.notaDinas.type === "application/pdf") {
				fileToProcess = await convertPdfToImage(files.notaDinas);
			}

			const formData = new FormData();
			formData.append("file", fileToProcess);

			const res = await fetch("/api/document/ocr", {
				method: "POST",
				body: formData,
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.details || result.error || "OCR failed");
			}

			const ocrData = result.data;

			// Auto-fill metadata surat
			setFormData((prev) => ({
				...prev,
				letter_number: ocrData.nomor_surat || prev.letter_number,
				letter_date: convertDateFormat(ocrData.tanggal_surat) || prev.letter_date,
				from_name: ocrData.dari_asal || prev.from_name,
				cc: ocrData.cc_tembusan || prev.cc,
				subject: ocrData.perihal || prev.subject,
			}));

			// Auto-fill disposition data
			const updatedDisposition: Partial<DispositionData> = {
				disposition_note: ocrData.disposition_note || dispositionData.disposition_note,
			};

			if (ocrData.agenda_scope) {
				updatedDisposition.agenda_scope = ocrData.agenda_scope;
			}
			if (ocrData.agenda_number) {
				updatedDisposition.agenda_number = ocrData.agenda_number;
			}
			if (ocrData.disposition_date) {
				updatedDisposition.disposition_date = convertDateFormat(ocrData.disposition_date);
			}

			// Fuzzy match disposition actions
			if (ocrData.disposition_actions && Array.isArray(ocrData.disposition_actions)) {
				const matchedActions = matchMultiple(
					ocrData.disposition_actions,
					masterActions,
					(action) => action.name,
					0.6 // 60% similarity threshold
				);
				updatedDisposition.disposition_actions = matchedActions.map((a) => a.name);
			}

			// Fuzzy match forward_to recipients
			if (ocrData.forward_to && Array.isArray(ocrData.forward_to)) {
				const matchedRecipients = matchMultiple(
					ocrData.forward_to,
					masterRecipients,
					(recipient) => recipient.name,
					0.6 // 60% similarity threshold
				);
				updatedDisposition.forward_to_ids = matchedRecipients.map((r) => r.id);
			}

			setDispositionData((prev) => ({ ...prev, ...updatedDisposition }));

			toast.success("✨ Data berhasil terisi otomatis!", {
				description: "Mohon periksa kembali keakuratan data sebelum menyimpan.",
				duration: 6000,
			});
		} catch (error: any) {
			console.error("OCR Error:", error);
			toast.error(error.message || "Gagal memproses OCR");
		} finally {
			setOcrLoading(false);
		}
	};

	const uploadFile = async (
		caseId: string,
		file: File,
		docTypeName: string,
		caseCode: string
	) => {
		// Find doc_type_id
		const docType = docTypes.find(
			(dt) => dt.name.toLowerCase() === docTypeName.toLowerCase()
		);
		const docTypeId = docType?.id || "";

		const data = new FormData();
		data.append("files", file); // api/uploads expects 'files' or 'file'
		data.append("ref_type", "PROCUREMENT_CASE");
		data.append("ref_id", caseId);
		if (docTypeId) {
			data.append("doc_type_id", docTypeId);
		}

		// Folder path: Procurement/<case_code>/<Type>
		let subFolder = "Surat Masuk";
		if (docTypeName.toLowerCase().includes("tor")) {
			subFolder = "ToR";
		} else if (docTypeName.toLowerCase().includes("rab")) {
			subFolder = "RAB";
		}
		const folderPath = `Procurement/${caseCode}/${subFolder}`;
		data.append("folder_path", folderPath);

		console.log(
			`Uploading ${docTypeName} to ${folderPath} with docType ${docTypeId}`
		);

		const response = await fetch("/api/uploads", {
			method: "POST",
			body: data,
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Gagal upload ${docTypeName}: ${errText}`);
		} else {
			console.log(`Uploaded ${docTypeName} successfully`);
		}
	};

	const handleSubmit = async (isDraft: boolean) => {
		setIsLoading(true);

		// Validation (Basic)
		if (
			!formData.from_name ||
			!formData.letter_date ||
			!formData.letter_number ||
			!formData.subject
		) {
			toast.error(
				"Mohon lengkapi semua field metadata yang wajib diisi."
			);
			setIsLoading(false);
			return;
		}

		if (!dispositionData.agenda_number) {
			toast.error("Nomor Agenda Disposisi wajib diisi");
			setIsLoading(false);
			return;
		}

		if (!files.notaDinas || !files.tor || !files.rab) {
			toast.error(
				"Mohon lampirkan semua dokumen (Nota Dinas, TOR, dan RAB)."
			);
			setIsLoading(false);
			return;
		}

		let createdCaseId: string | null = null;

		try {
			const endpoint = isDraft
				? "/api/nota-dinas/in"
				: "/api/nota-dinas/in/submit";

			// 1. Create Case & Correspondence
			const createRes = await fetch(endpoint, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					...formData,
					disposition: dispositionData,
				}),
			});

			if (!createRes.ok) {
				const err = await createRes.text();
				throw new Error(err || "Failed to process request");
			}

			const { case_id, case_code } = await createRes.json();
			createdCaseId = case_id;

			// 2. Upload Files if present
			const uploads = [];
			// Note: User requested "SCAN SURAT MASUK" for doc type mapping
			if (files.notaDinas)
				uploads.push(
					uploadFile(
						case_id,
						files.notaDinas,
						"SCAN SURAT MASUK",
						case_code
					)
				);
			if (files.tor)
				uploads.push(uploadFile(case_id, files.tor, "TOR", case_code));
			if (files.rab)
				uploads.push(uploadFile(case_id, files.rab, "RAB", case_code));

			await Promise.all(uploads);

			const actionText = isDraft
				? "Draft berhasil dibuat"
				: "Berhasil disubmit ke KPA";
			console.log(`${actionText}:`, case_code);
			toast.success(`${actionText}: ${case_code}`);
			router.push("/nota-dinas/surat-masuk");
		} catch (error: any) {
			console.error("Error submitting:", error);
			toast.error(
				error.message || "Terjadi kesalahan saat menyimpan data."
			);

			// Rollback if case was created but uploads failed
			if (createdCaseId) {
				try {
					console.log("Rolling back case creation:", createdCaseId);
					await fetch(`/api/procurement-cases/${createdCaseId}`, {
						method: "DELETE",
					});
					toast.info("Terjadi kesalahan saat menyimpan data.");
				} catch (rollbackError) {
					console.error("Rollback failed:", rollbackError);
				}
			}
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="max-w-4xl mx-auto md:p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/nota-dinas/surat-masuk">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Tambah Surat Masuk
					</h1>
					<p className="text-muted-foreground">
						Buat agenda baru untuk surat masuk atau nota dinas.
					</p>
				</div>
			</div>

			<form onSubmit={(e) => e.preventDefault()} className="space-y-8">
				{/* Upload Nota Dinas Section (OCR) */}
				<Card className="border-primary/20 bg-primary/5">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5 text-primary" />
							Upload Nota Dinas
						</CardTitle>
						<CardDescription>
							Upload file scan surat masuk/nota dinas di sini.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 border border-dashed border-primary/30 rounded-lg bg-background">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="file_notadinas">
										Scan Nota Dinas / Surat Masuk{" "}
										<span className="text-red-500">*</span>
									</Label>
									<Input
										id="file_notadinas"
										type="file"
										accept=".pdf,.jpg,.jpeg,.png"
										onChange={handleFileChange("notaDinas")}
										className="cursor-pointer"
									/>
									<p className="text-xs text-muted-foreground">
										Format: PDF, JPG, PNG. Max 10MB. (Untuk PDF, hanya halaman pertama yang diproses OCR)
									</p>
								</div>

								{/* OCR Button */}
								{files.notaDinas && (
									<Button
										type="button"
										onClick={handleProcessOCR}
										disabled={ocrLoading}
										className="w-full"
									>
										{ocrLoading ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Processing OCR...
											</>
										) : (
											<>
												<Sparkles className="mr-2 h-4 w-4" />
												Process OCR - Auto Fill Form
											</>
										)}
									</Button>
								)}

								{files.notaDinas && (
									<div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 p-3 rounded border border-blue-200">
										<Sparkles className="h-4 w-4 text-blue-600" />
										<span>
											<strong>OCR Ready:</strong> Klik tombol di atas untuk otomatis mengisi form dari dokumen scan
										</span>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
				
				{/* Alert Warning OCR */}
				<Alert className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
					<AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
					<AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
						<strong>Perhatian:</strong> Jika menggunakan OCR, mohon periksa kembali keakuratan semua data sebelum menyimpan.
					</AlertDescription>
				</Alert>

				{/* Metadata Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-primary" />
							<CardTitle>Metadata Surat</CardTitle>
						</div>
						<CardDescription>
							Informasi utama mengenai surat masuk.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="letter_number">
									Nomor Surat{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="letter_number"
									name="letter_number"
									placeholder="Contoh: ND/001/XYZ/2024"
									value={formData.letter_number}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="letter_date">
									Tanggal Surat{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="letter_date"
									name="letter_date"
									type="date"
									value={formData.letter_date}
									onChange={handleInputChange}
									required
								/>
							</div>
						</div>

						<div className="grid md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="from_name">
									Dari (Asal Surat){" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="from_name"
									name="from_name"
									placeholder="Nama Instansi / Divisi Pengirim"
									value={formData.from_name}
									onChange={handleInputChange}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="cc">
									CC (Tembusan){" "}
									<span className="text-muted-foreground text-xs">
										(Optional)
									</span>
								</Label>
								<Input
									id="cc"
									name="cc"
									placeholder="Contoh: Divisi Keuangan, Arsip"
									value={formData.cc}
									onChange={handleInputChange}
								/>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="subject">
								Perihal <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="subject"
								name="subject"
								placeholder="Inti atau perihal surat..."
								rows={3}
								value={formData.subject}
								onChange={handleInputChange}
								required
							/>
						</div>
					</CardContent>
				</Card>

				{/* Disposition Section */}
				<DispositionSection
					data={dispositionData}
					onChange={setDispositionData}
				/>

				{/* Attachments Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<Upload className="h-5 w-5 text-primary" />
							<CardTitle>Lampiran Dokumen</CardTitle>
						</div>
						<CardDescription>
							Dokumen pendukung yang wajib dilampirkan untuk
							proses pengadaan.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* TOR */}
						<div className="space-y-2">
							<Label htmlFor="file_tor">
								TOR (Terms of Reference){" "}
								<span className="text-red-500">*</span>
							</Label>
							<div className="flex items-center gap-4">
								<Input
									id="file_tor"
									type="file"
									accept=".pdf,.doc,.docx"
									onChange={handleFileChange("tor")}
									className="cursor-pointer"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Kerangka Acuan Kerja. Format: PDF, DOCX.
							</p>
						</div>

						<Separator />

						{/* RAB */}
						<div className="space-y-2">
							<Label htmlFor="file_rab">
								RAB (Rencana Anggaran Biaya){" "}
								<span className="text-red-500">*</span>
							</Label>
							<div className="flex items-center gap-4">
								<Input
									id="file_rab"
									type="file"
									accept=".pdf,.xls,.xlsx"
									onChange={handleFileChange("rab")}
									className="cursor-pointer"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Detail anggaran. Format: PDF, Excel.
							</p>
						</div>
					</CardContent>
				</Card>

				{/* Footer Actions */}
				<div className="flex justify-end gap-4">
					<Button
						type="button"
						variant="outline"
						onClick={() => router.back()}
					>
						Batal
					</Button>
					{/* <Button
						type="button"
						onClick={() => handleSubmit(true)}
						disabled={isLoading}
					>
						<Save className="mr-2 h-4 w-4" />
						Simpan Draft
					</Button> */}
					<Button
						type="button"
						onClick={() => handleSubmit(false)}
						disabled={isLoading}
						className="min-w-[150px]"
					>
						<Send className="mr-2 h-4 w-4" />
						Submit ke KPA
					</Button>
				</div>
			</form>
		</div>
	);
}
