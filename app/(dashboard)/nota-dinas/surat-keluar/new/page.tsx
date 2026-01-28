"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Send, Loader2 } from "lucide-react";
import { validateMicrosoftSession } from "@/lib/utils";

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function NewSuratKeluarPage() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	// Form State
	const [formData, setFormData] = useState({
		letter_number: "",
		letter_date: new Date().toISOString().split("T")[0],
		from_name: "",
		to_name: "",
		subject: "",
		description: "",
		status: "Selesai",
	});

	// File State
	const [scanFile, setScanFile] = useState<File | null>(null);
	const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>([]);

	useEffect(() => {
		const fetchDocTypes = async () => {
			try {
				const res = await fetch("/api/master/doc-type");
				if (res.ok) {
					const data = await res.json();
					setDocTypes(data);
					console.log("Loaded doc types:", data.map((dt: any) => dt.name));
				} else {
					console.error("Failed to fetch doc types, status:", res.status);
					toast.error("Gagal memuat tipe dokumen");
				}
			} catch (error) {
				console.error("Failed to fetch doc types", error);
				toast.error("Gagal memuat tipe dokumen");
			}
		};
		fetchDocTypes();
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

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setScanFile(e.target.files[0]);
		}
	};

	const uploadFile = async (
		caseId: string,
		file: File,
		docTypeName: string,
		caseCode: string
	) => {
		// Find doc_type_id - try exact match first, then case-insensitive
		let docType = docTypes.find((dt) => dt.name === docTypeName);
		
		if (!docType) {
			docType = docTypes.find(
				(dt) => dt.name.toLowerCase() === docTypeName.toLowerCase()
			);
		}

		// If still not found, try to find a generic "SURAT KELUAR" or similar
		if (!docType && docTypeName.includes("SURAT KELUAR")) {
			docType = docTypes.find(
				(dt) => dt.name.toLowerCase().includes("surat keluar") ||
					   dt.name.toLowerCase().includes("keluar")
			);
		}

		if (!docType) {
			// Log available doc types for debugging
			console.error("Available doc types:", docTypes.map(dt => dt.name));
			throw new Error(
				`Tipe dokumen "${docTypeName}" tidak ditemukan. Mohon hubungi administrator untuk menambahkan tipe dokumen ini.`
			);
		}

		const docTypeId = docType.id;

		const data = new FormData();
		data.append("files", file);
		data.append("ref_type", "PROCUREMENT_CASE");
		data.append("ref_id", caseId);
		data.append("doc_type_id", docTypeId);

		// Folder path: Procurement/<case_code>/Surat Keluar
		const folderPath = `Procurement/${caseCode}/Surat Keluar`;
		data.append("folder_path", folderPath);

		console.log(
			`Uploading ${docTypeName} to ${folderPath} with docType ${docTypeId} (${docType.name})`
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

	const handleSubmit = async () => {
		setIsLoading(true);

		// Validation
		if (
			!formData.letter_number ||
			!formData.letter_date ||
			!formData.from_name ||
			!formData.to_name ||
			!formData.subject
		) {
			toast.error("Mohon lengkapi semua field yang wajib diisi.");
			setIsLoading(false);
			return;
		}

		if (!scanFile) {
			toast.error("Mohon lampirkan scan surat keluar.");
			setIsLoading(false);
			return;
		}

		// Validate doc types are loaded
		if (docTypes.length === 0) {
			toast.error("Tipe dokumen belum dimuat. Mohon refresh halaman.");
			setIsLoading(false);
			return;
		}

		let createdCaseId: string | null = null;

		try {
			// Create Surat Keluar via API
			const createRes = await fetch("/api/nota-dinas/out/create", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!createRes.ok) {
				const err = await createRes.text();
				throw new Error(err || "Failed to create surat keluar");
			}

			const { case_id, case_code } = await createRes.json();
			createdCaseId = case_id;

			// Upload scan file
			if (scanFile) {
				// Try different doc type names in order of preference
				const possibleDocTypeNames = [
					"SCAN SURAT KELUAR",
					"SURAT KELUAR", 
					"Surat Keluar",
					"SCAN",
					"Dokumen",
				];
				
				let docTypeName = possibleDocTypeNames[0];
				
				// Find the first available doc type
				for (const name of possibleDocTypeNames) {
					const found = docTypes.find(
						(dt) => dt.name.toLowerCase() === name.toLowerCase() ||
							   dt.name.toLowerCase().includes(name.toLowerCase())
					);
					if (found) {
						docTypeName = found.name;
						break;
					}
				}
				
				await uploadFile(case_id, scanFile, docTypeName, case_code);
			}

			toast.success(`Surat Keluar berhasil dibuat: ${case_code}`);
			router.push("/nota-dinas/surat-keluar");
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
					<Link href="/nota-dinas/surat-keluar">
						<ArrowLeft className="h-5 w-5" />
					</Link>
				</Button>
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Tambah Surat Keluar
					</h1>
					<p className="text-muted-foreground">
						Buat surat keluar baru untuk pengadaan.
					</p>
				</div>
			</div>

			<form onSubmit={(e) => e.preventDefault()} className="space-y-8">
				{/* Metadata Section */}
				<Card>
					<CardHeader>
						<div className="flex items-center gap-2">
							<FileText className="h-5 w-5 text-primary" />
							<CardTitle>Informasi Surat</CardTitle>
						</div>
						<CardDescription>
							Informasi utama mengenai surat keluar.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="letter_number">
								Nomor PPK{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="letter_number"
								name="letter_number"
								placeholder="Contoh: PPK/001/2025"
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

						<div className="space-y-2">
							<Label htmlFor="from_name">
								Dari{" "}
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
							<Label htmlFor="to_name">
								Kepada{" "}
								<span className="text-red-500">*</span>
							</Label>
							<Input
								id="to_name"
								name="to_name"
								placeholder="Nama Instansi / Divisi Penerima"
								value={formData.to_name}
								onChange={handleInputChange}
								required
							/>
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

						<div className="space-y-2">
							<Label htmlFor="description">
								Keterangan{" "}
								<span className="text-muted-foreground text-xs">
									(Optional)
								</span>
							</Label>
							<Textarea
								id="description"
								name="description"
								placeholder="Keterangan tambahan..."
								rows={3}
								value={formData.description}
								onChange={handleInputChange}
							/>
						</div>
					</CardContent>
				</Card>

				{/* Upload Section */}
				<Card className="border-primary/20 bg-primary/5">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="h-5 w-5 text-primary" />
							Scan Surat Keluar
						</CardTitle>
						<CardDescription>
							Upload file scan surat keluar di sini.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="p-4 border border-dashed border-primary/30 rounded-lg bg-background">
							<div className="space-y-2">
								<Label htmlFor="file_scan">
									Scan Surat Keluar{" "}
									<span className="text-red-500">*</span>
								</Label>
								<Input
									id="file_scan"
									type="file"
									accept=".pdf,.jpg,.jpeg,.png"
									onChange={handleFileChange}
									className="cursor-pointer"
								/>
								<p className="text-xs text-muted-foreground">
									Format: PDF, JPG, PNG. Max 10MB.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Status Section */}
				<Card>
					<CardHeader>
						<CardTitle>Status</CardTitle>
						<CardDescription>
							Status surat keluar.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							<Label htmlFor="status">Status</Label>
							<Select
								value={formData.status}
								onValueChange={(value) =>
									setFormData((prev) => ({
										...prev,
										status: value,
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Selesai">Selesai</SelectItem>
									<SelectItem value="Draft">Draft</SelectItem>
									<SelectItem value="Proses">Proses</SelectItem>
								</SelectContent>
							</Select>
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
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSubmit}
						disabled={isLoading}
						className="min-w-[150px]"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Menyimpan...
							</>
						) : (
							<>
								<Send className="mr-2 h-4 w-4" />
								Kirim
							</>
						)}
					</Button>
				</div>
			</form>
		</div>
	);
}
