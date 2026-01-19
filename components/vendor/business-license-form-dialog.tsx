"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, FileText, Download } from "lucide-react";

interface BusinessLicenseFormData {
	license_type: string;
	license_number: string;
	qualification?: string;
	issued_date?: string;
	expiry_date?: string;
}

interface BusinessLicenseFormDialogProps {
	vendorId: string;
	licenseId?: string;
	initialData?: BusinessLicenseFormData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function BusinessLicenseFormDialog({
	vendorId,
	licenseId,
	initialData,
	open,
	onOpenChange,
	onSuccess,
}: BusinessLicenseFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [licenseFile, setLicenseFile] = useState<File | null>(null);
	const [existingLicenseDoc, setExistingLicenseDoc] = useState<any>(null);
	const [isUploadingDoc, setIsUploadingDoc] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isEdit = !!licenseId;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<BusinessLicenseFormData>({
		defaultValues: initialData || {
			license_type: "",
			license_number: "",
			qualification: "",
			issued_date: "",
			expiry_date: "",
		},
	});

	// Fetch existing business license document when editing
	useEffect(() => {
		if (open && isEdit && licenseId) {
			fetchExistingDocument();
		} else if (open && !isEdit) {
			setExistingLicenseDoc(null);
			setLicenseFile(null);
		}
	}, [open, isEdit, licenseId]);

	const fetchExistingDocument = async () => {
		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/business-licenses/${licenseId}/document`
			);
			if (response.ok) {
				const data = await response.json();
				setExistingLicenseDoc(data.document);
			}
		} catch (error) {
			console.error("Error fetching business license document:", error);
		}
	};

	useEffect(() => {
		if (open && initialData) {
			reset(initialData);
		} else if (open && !initialData) {
			reset({
				license_type: "",
				license_number: "",
				qualification: "",
				issued_date: "",
				expiry_date: "",
			});
		}
	}, [open, initialData, reset]);

	// File handling functions
	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file type
			if (file.type !== "application/pdf") {
				toast.error("File harus dalam format PDF");
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("Ukuran file maksimal 10MB");
				return;
			}

			setLicenseFile(file);
		}
	};

	const handleRemoveFile = () => {
		setLicenseFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleDownloadExisting = async () => {
		if (!existingLicenseDoc?.sp_download_url) return;
		window.open(existingLicenseDoc.sp_download_url, "_blank");
	};

	const handleDeleteExisting = async () => {
		if (!existingLicenseDoc || !licenseId) return;

		if (!confirm("Hapus dokumen ini?")) return;

		setIsUploadingDoc(true);
		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/business-licenses/${licenseId}/document`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				throw new Error("Gagal menghapus dokumen");
			}

			toast.success("Dokumen berhasil dihapus");
			setExistingLicenseDoc(null);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Gagal menghapus dokumen"
			);
		} finally {
			setIsUploadingDoc(false);
		}
	};

	const uploadLicenseDocument = async (licenseId: string) => {
		if (!licenseFile) return;

		setIsUploadingDoc(true);
		try {
			const formData = new FormData();
			formData.append("file", licenseFile);

			const response = await fetch(
				`/api/vendors/${vendorId}/business-licenses/${licenseId}/document`,
				{
					method: "POST",
					body: formData,
				}
			);

			if (!response.ok) {
				throw new Error("Gagal mengupload dokumen izin usaha");
			}

			toast.success("Dokumen izin usaha berhasil diupload");
			setLicenseFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Gagal mengupload dokumen"
			);
		} finally {
			setIsUploadingDoc(false);
		}
	};

	const onSubmit = async (data: BusinessLicenseFormData) => {
		setIsLoading(true);

		try {
			const url = isEdit
				? `/api/vendors/${vendorId}/business-licenses/${licenseId}`
				: `/api/vendors/${vendorId}/business-licenses`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(
					result.error || "Failed to save business license"
				);
			}

			toast.success(
				isEdit
					? "Business license updated successfully"
					: "Business license added successfully"
			);

			// Upload license document if there's a file
			if (licenseFile) {
				const savedLicenseId = isEdit ? licenseId : result.id;
				await uploadLicenseDocument(savedLicenseId);
			}

			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save business license"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Izin Usaha" : "Tambah Izin Usaha"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* License Type */}
					<div className="space-y-2">
						<Label htmlFor="license_type">
							Jenis Izin <span className="text-red-500">*</span>
						</Label>
						<Input
							id="license_type"
							placeholder="SIUP, TDP, NIB, dll"
							{...register("license_type", {
								required: "Jenis izin wajib diisi",
							})}
						/>
						{errors.license_type && (
							<p className="text-sm text-red-500">
								{errors.license_type.message}
							</p>
						)}
					</div>

					{/* License Number */}
					<div className="space-y-2">
						<Label htmlFor="license_number">
							Nomor Izin <span className="text-red-500">*</span>
						</Label>
						<Input
							id="license_number"
							placeholder="123456789"
							{...register("license_number", {
								required: "Nomor izin wajib diisi",
							})}
						/>
						{errors.license_number && (
							<p className="text-sm text-red-500">
								{errors.license_number.message}
							</p>
						)}
					</div>

					{/* Qualification */}
					<div className="space-y-2">
						<Label htmlFor="qualification">Kualifikasi</Label>
						<Input
							id="qualification"
							placeholder="Kecil atau Non Kecil"
							{...register("qualification")}
						/>
					</div>

					{/* Issue Date */}
					<div className="space-y-2">
						<Label htmlFor="issued_date">Tanggal Terbit</Label>
						<Input
							id="issued_date"
							type="date"
							{...register("issued_date")}
						/>
					</div>

					{/* Expiry Date */}
					<div className="space-y-2">
						<Label htmlFor="expiry_date">Tanggal Kadaluarsa</Label>
						<Input
							id="expiry_date"
							type="date"
							{...register("expiry_date")}
						/>
					</div>

					{/* Upload Izin Usaha */}
					<div className="space-y-2">
						<Label htmlFor="license_document">
							Upload Izin Usaha (PDF)
						</Label>

						{/* Display existing document when editing */}
						{isEdit && existingLicenseDoc && !licenseFile && (
							<div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
								<FileText className="h-5 w-5 text-green-600" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-green-900 truncate">
										{existingLicenseDoc.file_name}
									</p>
									<p className="text-xs text-green-700">
										{existingLicenseDoc.file_size
											? `${(
													Number(
														existingLicenseDoc.file_size
													) / 1024
											  ).toFixed(1)} KB`
											: "Unknown size"}
									</p>
								</div>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={handleDownloadExisting}
									disabled={isUploadingDoc}
								>
									<Download className="h-4 w-4" />
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={handleDeleteExisting}
									disabled={isUploadingDoc}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						)}

						{/* File input for new upload */}
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
								disabled={isLoading || isUploadingDoc}
								className="w-full"
							>
								<Upload className="mr-2 h-4 w-4" />
								{licenseFile
									? "Ganti File"
									: existingLicenseDoc
									? "Upload File Baru"
									: "Upload File"}
							</Button>
							<input
								ref={fileInputRef}
								type="file"
								accept=".pdf"
								onChange={handleFileChange}
								className="hidden"
							/>
						</div>

						{/* Display selected file preview */}
						{licenseFile && (
							<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
								<FileText className="h-5 w-5 text-blue-600" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-blue-900 truncate">
										{licenseFile.name}
									</p>
									<p className="text-xs text-blue-700">
										{(licenseFile.size / 1024).toFixed(1)}{" "}
										KB
									</p>
								</div>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={handleRemoveFile}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						)}

						<p className="text-xs text-muted-foreground">
							Format: PDF, Ukuran maksimal: 10MB
						</p>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Menyimpan..." : "Simpan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
