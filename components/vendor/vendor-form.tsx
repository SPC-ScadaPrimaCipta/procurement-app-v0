"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Upload, X, FileText, Download } from "lucide-react";

interface VendorFormData {
	vendor_name: string;
	supplier_type_id: string;
	npwp?: string;
	address?: string;
	is_active: boolean;
}

interface VendorFormProps {
	vendorId?: string;
	initialData?: VendorFormData & { id: string };
}

interface SupplierType {
	id: string;
	name: string;
}

export function VendorForm({ vendorId, initialData }: VendorFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
	const [loadingSupplierTypes, setLoadingSupplierTypes] = useState(true);
	const [npwpFile, setNpwpFile] = useState<File | null>(null);
	const [existingNpwpDoc, setExistingNpwpDoc] = useState<any>(null);
	const [isUploadingNpwp, setIsUploadingNpwp] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<VendorFormData>({
		defaultValues: initialData || {
			vendor_name: "",
			supplier_type_id: "",
			npwp: "",
			address: "",
			is_active: true,
		},
	});

	const isActive = watch("is_active");
	const selectedSupplierType = watch("supplier_type_id");

	// Fetch supplier types
	useEffect(() => {
		const fetchSupplierTypes = async () => {
			try {
				const response = await fetch("/api/master/supplier-types");
				if (response.ok) {
					const data = await response.json();
					setSupplierTypes(data);
				}
			} catch (error) {
				console.error("Error fetching supplier types:", error);
				// For now, use mock data since database migration is pending
				setSupplierTypes([
					{ id: "1", name: "PT (Perseroan Terbatas)" },
					{ id: "2", name: "CV (Commanditaire Vennootschap)" },
					{ id: "3", name: "Perorangan" },
					{ id: "4", name: "BUMN" },
					{ id: "5", name: "Koperasi" },
				]);
			} finally {
				setLoadingSupplierTypes(false);
			}
		};

		fetchSupplierTypes();
	}, []);

	// Fetch existing NPWP document if editing
	useEffect(() => {
		if (vendorId) {
			const fetchNpwpDoc = async () => {
				try {
					const response = await fetch(`/api/vendors/${vendorId}/npwp-document`);
					if (response.ok) {
						const data = await response.json();
						if (data.document) {
							setExistingNpwpDoc(data.document);
						}
					}
				} catch (error) {
					console.error("Error fetching NPWP document:", error);
				}
			};

			fetchNpwpDoc();
		}
	}, [vendorId]);

	const onSubmit = async (data: VendorFormData) => {
		setIsLoading(true);

		try {
			const url = vendorId ? `/api/vendors/${vendorId}` : "/api/vendors";
			const method = vendorId ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to save vendor");
			}

			// Upload NPWP file if selected
			if (npwpFile) {
				await uploadNpwpFile(result.id);
			}

			toast.success(
				vendorId ? "Vendor updated successfully" : "Vendor created successfully"
			);
			router.push("/vendor");
			router.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save vendor"
			);
		} finally {
			setIsLoading(false);
		}
	};

	const uploadNpwpFile = async (vendorIdToUpload: string) => {
		if (!npwpFile) return;

		setIsUploadingNpwp(true);
		try {
			const formData = new FormData();
			formData.append("file", npwpFile);

			const response = await fetch(`/api/vendors/${vendorIdToUpload}/npwp-document`, {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to upload NPWP document");
			}

			toast.success("NPWP document uploaded successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to upload NPWP document"
			);
		} finally {
			setIsUploadingNpwp(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			// Validate file type (PDF only)
			if (file.type !== "application/pdf") {
				toast.error("Only PDF files are allowed");
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				toast.error("File size must be less than 10MB");
				return;
			}

			setNpwpFile(file);
		}
	};

	const handleRemoveFile = () => {
		setNpwpFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleDeleteExistingDoc = async () => {
		if (!vendorId || !existingNpwpDoc) return;

		try {
			const response = await fetch(`/api/vendors/${vendorId}/npwp-document`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete NPWP document");
			}

			setExistingNpwpDoc(null);
			toast.success("NPWP document deleted successfully");
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete NPWP document"
			);
		}
	};

	const handleDownload = (url: string, fileName: string) => {
		const link = document.createElement("a");
		link.href = url;
		link.download = fileName;
		link.target = "_blank";
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
			<div className="space-y-4">
				{/* Vendor Name */}
				<div className="space-y-2">
					<Label htmlFor="vendor_name">
						Nama Vendor <span className="text-red-500">*</span>
					</Label>
					<Input
						id="vendor_name"
						placeholder="PT Maju Jaya Konstruksi"
						{...register("vendor_name", {
							required: "Nama vendor wajib diisi",
						})}
					/>
					{errors.vendor_name && (
						<p className="text-sm text-red-500">{errors.vendor_name.message}</p>
					)}
				</div>

				{/* Supplier Type */}
				<div className="space-y-2">
					<Label htmlFor="supplier_type_id">
						Tipe Supplier <span className="text-red-500">*</span>
					</Label>
					<Select
						value={selectedSupplierType}
						onValueChange={(value) => setValue("supplier_type_id", value)}
						disabled={loadingSupplierTypes}
					>
						<SelectTrigger>
							<SelectValue placeholder="Pilih tipe supplier" />
						</SelectTrigger>
						<SelectContent>
							{supplierTypes.map((type) => (
								<SelectItem key={type.id} value={type.id}>
									{type.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					{errors.supplier_type_id && (
						<p className="text-sm text-red-500">
							{errors.supplier_type_id.message}
						</p>
					)}
				</div>

				{/* NPWP */}
				<div className="space-y-2">
					<Label htmlFor="npwp">NPWP</Label>
					<Input
						id="npwp"
						placeholder="01.234.567.8-901.000"
						{...register("npwp")}
					/>
					<p className="text-xs text-muted-foreground">
						Format: 01.234.567.8-901.000 (optional)
					</p>
				</div>

				{/* Address */}
				<div className="space-y-2">
					<Label htmlFor="address">Alamat</Label>
					<Textarea
						id="address"
						placeholder="Jl. Sudirman No. 123, Jakarta"
						rows={3}
						{...register("address")}
					/>
				</div>

				{/* NPWP File Upload */}
				<div className="space-y-2">
					<Label htmlFor="npwp_file">Scan NPWP (PDF)</Label>

					{/* Existing Document Display */}
					{existingNpwpDoc && !npwpFile && (
						<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">{existingNpwpDoc.file_name}</p>
									<p className="text-xs text-muted-foreground">
										Uploaded: {new Date(existingNpwpDoc.uploaded_at).toLocaleDateString('id-ID')}
									</p>
								</div>
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() =>
										handleDownload(existingNpwpDoc.file_url || "", existingNpwpDoc.file_name || "")
									}
								>
									<Download className="h-4 w-4" />
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={handleDeleteExistingDoc}
								>
									<X className="h-4 w-4 text-destructive" />
								</Button>
							</div>
						</div>
					)}

					{/* New File Selection */}
					{npwpFile ? (
						<div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
							<div className="flex items-center gap-3">
								<FileText className="h-5 w-5 text-muted-foreground" />
								<div>
									<p className="text-sm font-medium">{npwpFile.name}</p>
									<p className="text-xs text-muted-foreground">
										{(npwpFile.size / 1024).toFixed(2)} KB
									</p>
								</div>
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
					) : !existingNpwpDoc && (
						<div className="flex items-center gap-2">
							<Input
								id="npwp_file"
								type="file"
								accept=".pdf"
								ref={fileInputRef}
								onChange={handleFileChange}
								className="hidden"
							/>
							<Button
								type="button"
								variant="outline"
								onClick={() => fileInputRef.current?.click()}
								className="w-full"
							>
								<Upload className="h-4 w-4 mr-2" />
								Upload Scan NPWP (PDF)
							</Button>
						</div>
					)}

					{!existingNpwpDoc && !npwpFile && (
						<p className="text-xs text-muted-foreground">
							Upload scan NPWP dalam format PDF (max 10MB)
						</p>
					)}
				</div>

				{/* Active Status */}
				<div className="flex items-center justify-between rounded-lg border p-4">
					<div className="space-y-0.5">
						<Label htmlFor="is_active">Status Aktif</Label>
						<p className="text-sm text-muted-foreground">
							Vendor aktif dapat dipilih untuk kontrak baru
						</p>
					</div>
					<Switch
						id="is_active"
						checked={isActive}
						onCheckedChange={(checked) => setValue("is_active", checked)}
					/>
				</div>
			</div>

			{/* Form Actions */}
			<div className="flex items-center gap-4">
				<Button type="submit" disabled={isLoading || isUploadingNpwp}>
					{isLoading || isUploadingNpwp
						? "Menyimpan..."
						: vendorId
						? "Update Vendor"
						: "Tambah Vendor"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/vendor")}
					disabled={isLoading || isUploadingNpwp}
				>
					Batal
				</Button>
			</div>
		</form>
	);
}
