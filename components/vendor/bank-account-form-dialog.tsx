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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Upload, X, FileText, Download } from "lucide-react";

interface BankAccountFormData {
	account_number: string;
	account_name?: string;
	bank_name?: string;
	branch_name?: string;
	currency_code?: string;
	is_primary: boolean;
}

interface BankAccountFormDialogProps {
	vendorId: string;
	accountId?: string;
	initialData?: BankAccountFormData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function BankAccountFormDialog({
	vendorId,
	accountId,
	initialData,
	open,
	onOpenChange,
	onSuccess,
}: BankAccountFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [bankAccountFile, setBankAccountFile] = useState<File | null>(null);
	const [existingBankDoc, setExistingBankDoc] = useState<any>(null);
	const [isUploadingDoc, setIsUploadingDoc] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const isEdit = !!accountId;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<BankAccountFormData>({
		defaultValues: initialData || {
			account_number: "",
			account_name: "",
			bank_name: "",
			branch_name: "",
			currency_code: "IDR",
			is_primary: false,
		},
	});

	const isPrimary = watch("is_primary");

	// Fetch existing bank account document when editing
	useEffect(() => {
		if (open && isEdit && accountId) {
			fetchExistingDocument();
		} else if (open && !isEdit) {
			setExistingBankDoc(null);
			setBankAccountFile(null);
		}
	}, [open, isEdit, accountId]);

	const fetchExistingDocument = async () => {
		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/bank-accounts/${accountId}/document`
			);
			if (response.ok) {
				const data = await response.json();
				setExistingBankDoc(data.document);
			}
		} catch (error) {
			console.error("Error fetching bank account document:", error);
		}
	};

	useEffect(() => {
		if (open && initialData) {
			reset(initialData);
		} else if (open && !initialData) {
			reset({
				account_number: "",
				account_name: "",
				bank_name: "",
				branch_name: "",
				currency_code: "IDR",
				is_primary: false,
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

			setBankAccountFile(file);
		}
	};

	const handleRemoveFile = () => {
		setBankAccountFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleDownloadExisting = async () => {
		if (!existingBankDoc?.sp_download_url) return;
		window.open(existingBankDoc.sp_download_url, "_blank");
	};

	const handleDeleteExisting = async () => {
		if (!existingBankDoc || !accountId) return;

		if (!confirm("Hapus dokumen ini?")) return;

		setIsUploadingDoc(true);
		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/bank-accounts/${accountId}/document`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				throw new Error("Gagal menghapus dokumen");
			}

			toast.success("Dokumen berhasil dihapus");
			setExistingBankDoc(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Gagal menghapus dokumen"
			);
		} finally {
			setIsUploadingDoc(false);
		}
	};

	const uploadBankAccountDocument = async (accountId: string) => {
		if (!bankAccountFile) return;

		setIsUploadingDoc(true);
		try {
			const formData = new FormData();
			formData.append("file", bankAccountFile);

			const response = await fetch(
				`/api/vendors/${vendorId}/bank-accounts/${accountId}/document`,
				{
					method: "POST",
					body: formData,
				}
			);

			if (!response.ok) {
				throw new Error("Gagal mengupload dokumen rekening");
			}

			toast.success("Dokumen rekening berhasil diupload");
			setBankAccountFile(null);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Gagal mengupload dokumen"
			);
		} finally {
			setIsUploadingDoc(false);
		}
	};

	const onSubmit = async (data: BankAccountFormData) => {
		setIsLoading(true);

		try {
			const url = isEdit
				? `/api/vendors/${vendorId}/bank-accounts/${accountId}`
				: `/api/vendors/${vendorId}/bank-accounts`;
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
				throw new Error(result.error || "Failed to save bank account");
			}

			toast.success(
				isEdit
					? "Bank account updated successfully"
					: "Bank account added successfully"
			);

			// Upload bank account document if there's a file
			if (bankAccountFile) {
				const savedAccountId = isEdit ? accountId : result.id;
				await uploadBankAccountDocument(savedAccountId);
			}

			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save bank account"
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
						{isEdit ? "Edit Rekening Bank" : "Tambah Rekening Bank"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* Account Number */}
					<div className="space-y-2">
						<Label htmlFor="account_number">
							Nomor Rekening <span className="text-red-500">*</span>
						</Label>
						<Input
							id="account_number"
							placeholder="1234567890"
							{...register("account_number", {
								required: "Nomor rekening wajib diisi",
							})}
						/>
						{errors.account_number && (
							<p className="text-sm text-red-500">
								{errors.account_number.message}
							</p>
						)}
					</div>

					{/* Account Name */}
					<div className="space-y-2">
						<Label htmlFor="account_name">Nama Rekening</Label>
						<Input
							id="account_name"
							placeholder="PT Maju Jaya Konstruksi"
							{...register("account_name")}
						/>
					</div>

					{/* Bank Name */}
					<div className="space-y-2">
						<Label htmlFor="bank_name">Nama Bank</Label>
						<Input
							id="bank_name"
							placeholder="Bank Mandiri"
							{...register("bank_name")}
						/>
					</div>

					{/* Branch Name */}
					<div className="space-y-2">
						<Label htmlFor="branch_name">Nama Cabang</Label>
						<Input
							id="branch_name"
							placeholder="KC Daan Mogot"
							{...register("branch_name")}
						/>
					</div>

					{/* Currency Code */}
					<div className="space-y-2">
						<Label htmlFor="currency_code">Kode Mata Uang</Label>
						<Input
							id="currency_code"
							placeholder="IDR"
							{...register("currency_code")}
						/>
						<p className="text-xs text-muted-foreground">
							Default: IDR (Rupiah Indonesia)
						</p>
					</div>

					{/* Upload Scan Rekening */}
					<div className="space-y-2">
						<Label htmlFor="bank_document">Scan Rekening Koran (PDF)</Label>

						{/* Display existing document when editing */}
						{isEdit && existingBankDoc && !bankAccountFile && (
							<div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
								<FileText className="h-5 w-5 text-green-600" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-green-900 truncate">
										{existingBankDoc.file_name}
									</p>
									<p className="text-xs text-green-700">
										{existingBankDoc.file_size
											? `${(Number(existingBankDoc.file_size) / 1024).toFixed(1)} KB`
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
								{bankAccountFile
									? "Ganti File"
									: existingBankDoc
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
						{bankAccountFile && (
							<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
								<FileText className="h-5 w-5 text-blue-600" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium text-blue-900 truncate">
										{bankAccountFile.name}
									</p>
									<p className="text-xs text-blue-700">
										{(bankAccountFile.size / 1024).toFixed(1)} KB
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

					{/* Is Primary */}
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<Label htmlFor="is_primary">Rekening Utama</Label>
							<p className="text-sm text-muted-foreground">
								Rekening ini akan digunakan untuk pembayaran default
							</p>
						</div>
						<Switch
							id="is_primary"
							checked={isPrimary}
							onCheckedChange={(checked) => setValue("is_primary", checked)}
						/>
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
