"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Send, Save, Cross } from "lucide-react";
import { authClient } from "@/lib/auth-client";

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

		// Check Microsoft Token Status
		const checkMicrosoftToken = async () => {
			try {
				// We'll use a dry-run upload or a specific status endpoint
				// For now, let's try to hit the uploads endpoint with a dummy check or just assume if we fail during upload we fail.
				// But user asked to check "when user access this page".
				// So we can try to refresh token via a dedicated endpoint or checking the account status.
				// Since we don't have a dedicated "check-token" endpoint yet, let's assume we proceed.
				// Wait, the user specifically asked for this check.
				// "call function to check expiration of microsoft... prevent this happen"
				// I will create a simple API endpoint to validate the token.
			} catch (e) {
				//
			}
		};
	}, []);

	// Actually, let's just create a new useEffect that calls a new API route for checking token.
	useEffect(() => {
		const validateMicrosoftSession = async () => {
			try {
				const res = await fetch("/api/auth/check-microsoft-token");
				if (!res.ok) {
					const data = await res.json();
					if (
						data.error === "consent_required" ||
						data.error === "invalid_grant"
					) {
						toast.error(
							"Sesi Microsoft kadaluarsa. Mohon login ulang."
						);
						await authClient.signOut();
						router.push("/auth/login");
					}
				}
			} catch (error) {
				console.error("Token validation error", error);
			}
		};
		validateMicrosoftSession();
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
				body: JSON.stringify(formData),
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
								<span className="text-red-500">*</span>
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
