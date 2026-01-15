"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { type Reimbursement } from "./reimbursement-columns";
import { FileText } from "lucide-react";

interface ReimbursementDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reimbursement: Reimbursement | null;
	onSuccess: () => void;
}

interface DocumentInfo {
	id: string;
	file_name: string;
	file_size: number;
	created_at: string;
}

export function ReimbursementDeleteDialog({
	open,
	onOpenChange,
	reimbursement,
	onSuccess,
}: ReimbursementDeleteDialogProps) {
	const [loading, setLoading] = useState(false);
	const [documents, setDocuments] = useState<DocumentInfo[]>([]);
	const [loadingDocs, setLoadingDocs] = useState(false);

	useEffect(() => {
		if (open && reimbursement) {
			fetchDocuments();
		}
	}, [open, reimbursement]);

	const fetchDocuments = async () => {
		if (!reimbursement) return;

		setLoadingDocs(true);
		try {
			const response = await fetch(`/api/reimbursement/${reimbursement.id}/document`);
			if (response.ok) {
				const data = await response.json();
				// GET endpoint returns single document, convert to array
				if (data.document) {
					setDocuments([data.document]);
				} else {
					setDocuments([]);
				}
			} else if (response.status === 404) {
				// No document found, that's ok
				setDocuments([]);
			}
		} catch (error) {
			console.error("Failed to fetch documents:", error);
			setDocuments([]);
		} finally {
			setLoadingDocs(false);
		}
	};

	const handleDelete = async () => {
		if (!reimbursement) return;

		setLoading(true);
		try {
			const response = await fetch(`/api/reimbursement/${reimbursement.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete reimbursement");
			}

			toast.success("Reimbursement berhasil dihapus");
			onSuccess();
		} catch (error) {
			toast.error("Gagal menghapus reimbursement");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	if (!reimbursement) return null;

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-lg">
				<DialogHeader>
					<DialogTitle>Hapus Reimbursement</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus reimbursement ini? Semua data dan dokumen terkait akan dihapus secara permanen.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4 space-y-4">
					<div className="space-y-2">
						<div>
							<span className="text-sm font-medium">No Reimbursement:</span>
							<p className="text-sm text-muted-foreground">
								{reimbursement.reimbursement_no}
							</p>
						</div>
						<div>
							<span className="text-sm font-medium">Nama Penyedia:</span>
							<p className="text-sm text-muted-foreground">
								{reimbursement.vendor?.vendor_name || "-"}
							</p>
						</div>
						<div>
							<span className="text-sm font-medium">Nilai Kwitansi:</span>
							<p className="text-sm text-muted-foreground">
								{new Intl.NumberFormat("id-ID", {
									style: "currency",
									currency: "IDR",
									minimumFractionDigits: 0,
								}).format(reimbursement.nilai_kwitansi)}
							</p>
						</div>
					</div>

					{loadingDocs ? (
						<div className="text-sm text-muted-foreground">
							Memuat dokumen...
						</div>
					) : documents.length > 0 ? (
						<div className="border rounded-lg p-3 bg-muted/50">
							<div className="flex items-center gap-2 mb-2">
								<FileText className="h-4 w-4 text-destructive" />
								<span className="text-sm font-medium">Dokumen yang akan dihapus:</span>
							</div>
							{documents.map((doc) => (
								<div key={doc.id} className="ml-6 text-sm text-muted-foreground">
									<div className="flex justify-between items-center">
										<span className="truncate">{doc.file_name}</span>
										<span className="text-xs ml-2">{formatFileSize(doc.file_size)}</span>
									</div>
								</div>
							))}
						</div>
					) : null}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Batal
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
					>
						{loading ? "Menghapus..." : "Hapus"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
