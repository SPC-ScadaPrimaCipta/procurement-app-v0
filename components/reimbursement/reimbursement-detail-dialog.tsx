"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, Trash2, Download, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { type Reimbursement } from "./reimbursement-columns";

interface ReimbursementDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reimbursement: Reimbursement | null;
	onEdit: (reimbursement: Reimbursement) => void;
	onDelete: (reimbursement: Reimbursement) => void;
	onRefresh: () => void;
}

type ReimbursementFile = {
	id: string;
	file_name: string;
	mime_type: string | null;
	file_size: string;
	file_url: string | null;
	uploaded_at: Date;
};

export function ReimbursementDetailDialog({
	open,
	onOpenChange,
	reimbursement,
	onEdit,
	onDelete,
	onRefresh,
}: ReimbursementDetailDialogProps) {
	const [files, setFiles] = useState<ReimbursementFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [showVendorDetail, setShowVendorDetail] = useState(false);

	useEffect(() => {
		if (open && reimbursement) {
			fetchFiles();
		}
	}, [open, reimbursement]);

	const fetchFiles = async () => {
		if (!reimbursement) return;

		try {
			const response = await fetch(
				`/api/reimbursement/${reimbursement.id}/files`
			);
			if (!response.ok) throw new Error("Failed to fetch files");

			const data = await response.json();
			setFiles(data);
		} catch (error) {
			console.error("Error fetching files:", error);
		}
	};

	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file || !reimbursement) return;

		setUploading(true);
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(
				`/api/reimbursement/${reimbursement.id}/files`,
				{
					method: "POST",
					body: formData,
				}
			);

			if (!response.ok) throw new Error("Failed to upload file");

			toast.success("File berhasil diupload");
			fetchFiles();
			onRefresh();
		} catch (error) {
			toast.error("Gagal upload file");
			console.error(error);
		} finally {
			setUploading(false);
			event.target.value = "";
		}
	};

	const handleFileDelete = async (fileId: string) => {
		if (!reimbursement) return;
		if (!confirm("Hapus file ini?")) return;

		try {
			const response = await fetch(
				`/api/reimbursement/${reimbursement.id}/files/${fileId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) throw new Error("Failed to delete file");

			toast.success("File berhasil dihapus");
			fetchFiles();
			onRefresh();
		} catch (error) {
			toast.error("Gagal menghapus file");
			console.error(error);
		}
	};

	const formatFileSize = (bytes: string) => {
		const size = parseInt(bytes);
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
		return `${(size / (1024 * 1024)).toFixed(1)} MB`;
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("id-ID", {
			style: "currency",
			currency: "IDR",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	if (!reimbursement) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<div className="flex items-start justify-between">
						<div>
							<DialogTitle className="text-xl">
								Detail Reimbursement
							</DialogTitle>
							<p className="text-sm text-muted-foreground mt-1">
								{reimbursement.reimbursement_no}
							</p>
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => onEdit(reimbursement)}
							>
								<Edit className="h-4 w-4 mr-2" />
								Edit
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => onDelete(reimbursement)}
							>
								<Trash2 className="h-4 w-4 mr-2" />
								Hapus
							</Button>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-6">
					{/* Validasi PPK */}
					<div>
						<h3 className="font-semibold mb-3">Validasi PPK</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium text-muted-foreground">
									No Validasi PPK
								</label>
								<p className="mt-1">{reimbursement.no_validasi_ppk}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground">
									Tanggal Validasi PPK
								</label>
								<p className="mt-1">
									{new Date(reimbursement.tgl_validasi_ppk).toLocaleDateString(
										"id-ID"
									)}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Vendor */}
					<div>
						<h3 className="font-semibold mb-3">Penyedia</h3>
						<div>
							<label className="text-sm font-medium text-muted-foreground">
								Nama Penyedia
							</label>
							<div className="flex items-center gap-2 mt-1">
								<p>{reimbursement.vendor.vendor_name}</p>
								<Button
									variant="ghost"
									size="sm"
									className="h-6 px-2"
									onClick={() => {
										// TODO: Open vendor detail dialog
										toast.info("Vendor detail akan dibuka");
									}}
								>
									<ExternalLink className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</div>

					<Separator />

					{/* Kwitansi */}
					<div>
						<h3 className="font-semibold mb-3">Kwitansi</h3>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium text-muted-foreground">
									Nomor Kwitansi
								</label>
								<p className="mt-1">{reimbursement.nomor_kwitansi}</p>
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground">
									Tanggal Kwitansi
								</label>
								<p className="mt-1">
									{new Date(reimbursement.tanggal_kwitansi).toLocaleDateString(
										"id-ID"
									)}
								</p>
							</div>
							<div className="col-span-2">
								<label className="text-sm font-medium text-muted-foreground">
									Nilai Kwitansi
								</label>
								<p className="mt-1 text-lg font-semibold text-green-600">
									{formatCurrency(reimbursement.nilai_kwitansi)}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Uraian */}
					<div>
						<h3 className="font-semibold mb-3">Uraian Pekerjaan</h3>
						<p className="text-sm whitespace-pre-wrap">
							{reimbursement.uraian_pekerjaan}
						</p>
					</div>

					<Separator />

					{/* Status & Keterangan */}
					<div>
						<div className="grid grid-cols-2 gap-4">
							<div>
								<label className="text-sm font-medium text-muted-foreground">
									Status
								</label>
								<div className="mt-1">
									<Badge>{reimbursement.status.name}</Badge>
								</div>
							</div>
							<div>
								<label className="text-sm font-medium text-muted-foreground">
									Keterangan
								</label>
								<p className="mt-1 text-sm">
									{reimbursement.keterangan || "-"}
								</p>
							</div>
						</div>
					</div>

					<Separator />

					{/* Upload Scan */}
					<div>
						<div className="flex items-center justify-between mb-3">
							<h3 className="font-semibold">Upload Scan</h3>
							<label htmlFor="file-upload">
								<Button
									variant="outline"
									size="sm"
									disabled={uploading}
									onClick={() => document.getElementById("file-upload")?.click()}
								>
									<Upload className="h-4 w-4 mr-2" />
									{uploading ? "Uploading..." : "Upload File"}
								</Button>
								<input
									id="file-upload"
									type="file"
									className="hidden"
									onChange={handleFileUpload}
									accept=".pdf,.jpg,.jpeg,.png"
								/>
							</label>
						</div>

						{files.length > 0 ? (
							<div className="space-y-2">
								{files.map((file) => (
									<div
										key={file.id}
										className="flex items-center justify-between p-3 border rounded-lg"
									>
										<div className="flex-1">
											<p className="font-medium text-sm">{file.file_name}</p>
											<p className="text-xs text-muted-foreground">
												{formatFileSize(file.file_size)} •{" "}
												{new Date(file.uploaded_at).toLocaleDateString("id-ID")}
											</p>
										</div>
										<div className="flex gap-2">
											{file.file_url && (
												<a
													href={file.file_url}
													target="_blank"
													rel="noopener noreferrer"
												>
													<Button variant="ghost" size="sm">
														<Download className="h-4 w-4" />
													</Button>
												</a>
											)}
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleFileDelete(file.id)}
											>
												<Trash2 className="h-4 w-4 text-destructive" />
											</Button>
										</div>
									</div>
								))}
							</div>
						) : (
							<p className="text-sm text-muted-foreground text-center py-4">
								Belum ada file yang diupload
							</p>
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
