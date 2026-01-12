"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Send, Save } from "lucide-react";

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

export default function NewSuratMasukPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Form State
	const [formData, setFormData] = useState({
		from_name: "",
		letter_date: "",
		letter_number: "",
		subject: "",
		cc: "",
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

	const uploadFile = async (
		caseId: string,
		file: File,
		docTypeName: string
	) => {
		const data = new FormData();
		data.append("file", file);
		data.append("doc_type_name", docTypeName);
		data.append("title", file.name);

		const response = await fetch(
			`/api/procurement-cases/${caseId}/documents`,
			{
				method: "POST",
				body: data,
			}
		);

		if (!response.ok) {
			console.error(`Failed to upload ${docTypeName}`);
			// Non-blocking error for now
		}
	};

	const handleCreateDraft = async () => {
		setIsLoading(true);

		// Validation (Basic)
		if (
			!formData.from_name ||
			!formData.letter_date ||
			!formData.letter_number ||
			!formData.subject
		) {
			toast.error("Mohon lengkapi semua field yang wajib diisi.");
			setIsLoading(false);
			return;
		}

		try {
			// 1. Create Case & Correspondence
			const createRes = await fetch("/api/nota-dinas/in", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!createRes.ok) {
				const err = await createRes.text();
				throw new Error(err || "Failed to create case");
			}

			const { case_id, case_code } = await createRes.json();

			// 2. Upload Files if present
			const uploads = [];
			if (files.notaDinas)
				uploads.push(
					uploadFile(case_id, files.notaDinas, "SCAN NOTA DINAS")
				);
			if (files.tor) uploads.push(uploadFile(case_id, files.tor, "TOR"));
			if (files.rab) uploads.push(uploadFile(case_id, files.rab, "RAB"));

			await Promise.all(uploads);

			console.log("Draft Created:", case_code);
			toast.success(`Draft berhasil dibuat: ${case_code}`);
			router.push("/nota-dinas/surat-masuk");
		} catch (error) {
			console.error("Error submitting:", error);
			toast.error("Terjadi kesalahan saat menyimpan data.");
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
				{/* Metadata Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Metadata Surat
						</CardTitle>
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

				{/* Attachments Section */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5" />
							Lampiran Dokumen
						</CardTitle>
						<CardDescription>
							Dokumen pendukung yang wajib dilampirkan untuk
							proses pengadaan.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Scan Nota Dinas */}
						<div className="space-y-2">
							<Label htmlFor="file_notadinas">
								Scan Nota Dinas / Surat Masuk{" "}
								<span className="text-muted-foreground">
									(Optional)
								</span>
							</Label>
							<div className="flex items-center gap-4">
								<Input
									id="file_notadinas"
									type="file"
									accept=".pdf,.jpg,.jpeg,.png"
									onChange={handleFileChange("notaDinas")}
									className="cursor-pointer"
								/>
							</div>
							<p className="text-xs text-muted-foreground">
								Format: PDF, JPG, PNG. Max 10MB.
							</p>
						</div>

						<Separator />

						{/* TOR */}
						<div className="space-y-2">
							<Label htmlFor="file_tor">
								TOR (Terms of Reference){" "}
								<span className="text-muted-foreground">
									(Optional)
								</span>
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
								<span className="text-muted-foreground">
									(Optional)
								</span>
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
						variant="outline"
						type="button"
						onClick={() => router.back()}
					>
						Batal
					</Button>
					<Button
						type="button"
						onClick={handleCreateDraft}
						disabled={isLoading}
					>
						<Save className="mr-2 h-4 w-4" />
						Simpan Draft
					</Button>
					<Button
						type="button"
						disabled={true}
						className="min-w-[150px] opacity-50 cursor-not-allowed"
					>
						<Send className="mr-2 h-4 w-4" />
						Submit ke KPA
					</Button>
				</div>
			</form>
		</div>
	);
}
