"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Peraturan } from "./peraturan-columns";

interface PeraturanDetailDialogProps {
	peraturanId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onEdit: (peraturan: Peraturan) => void;
	onDelete: (peraturan: Peraturan) => void;
}

interface PeraturanDetail {
	id: string;
	doc_number: string;
	title: string;
	type: {
		name: string;
	};
	documents: Array<{
		id: string;
		file_name: string;
		file_url: string;
		mime_type: string;
		file_size: string;
		title: string;
		uploaded_at: string;
		master_doc_type: {
			id: string;
			name: string;
		};
	}>;
}

export function PeraturanDetailDialog({
	peraturanId,
	open,
	onOpenChange,
	onEdit,
	onDelete,
}: PeraturanDetailDialogProps) {
	const [peraturan, setPeraturan] = useState<PeraturanDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		if (open && peraturanId) {
			fetchPeraturanDetail();
		}
	}, [open, peraturanId]);

	const fetchPeraturanDetail = async () => {
		if (!peraturanId) return;

		setIsLoading(true);
		try {
			// Fetch regulation detail
			const response = await fetch(`/api/peraturan/${peraturanId}`);
			if (!response.ok) throw new Error("Failed to fetch peraturan detail");
			const regulationData = await response.json();

			// Fetch documents from document table
			const documentsResponse = await fetch(
				`/api/peraturan/${peraturanId}/documents`
			);
			if (!documentsResponse.ok)
				throw new Error("Failed to fetch documents");
			const documentsData = await documentsResponse.json();

			setPeraturan({
				...regulationData,
				documents: documentsData,
			});
		} catch (error) {
			toast.error("Failed to load peraturan details");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleDownload = (fileUrl: string, fileName: string) => {
		const link = document.createElement("a");
		link.href = fileUrl;
		link.download = fileName;
		link.click();
	};

	if (!peraturan && !isLoading) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<div className="flex items-center justify-between pr-8">
						<DialogTitle className="text-xl">
							{peraturan?.doc_number}
						</DialogTitle>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="outline"
								onClick={() => peraturan && onEdit(peraturan as any)}
							>
								<Pencil className="h-4 w-4 mr-2" />
								Edit
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => peraturan && onDelete(peraturan as any)}
							>
								<Trash2 className="h-4 w-4 mr-2 text-destructive" />
								Hapus
							</Button>
						</div>
					</div>
			</DialogHeader>

			{isLoading ? (
				<div className="py-8 text-center text-muted-foreground">
					Loading...
				</div>
			) : peraturan ? (
				<div className="space-y-6">
					{/* Basic Info */}
					<div className="space-y-3">
						<div>
							<p className="text-sm text-muted-foreground">Nomor Dokumen</p>
							<p className="font-medium">{peraturan.doc_number}</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Judul Dokumen</p>
							<p>{peraturan.title}</p>
						</div>

						<div>
							<p className="text-sm text-muted-foreground">Tipe Dokumen</p>
							<p>{peraturan.type.name}</p>
						</div>
					</div>
						{peraturan.documents && peraturan.documents.length > 0 && (
							<div className="space-y-3">
								<p className="text-sm font-semibold">Lampiran Dokumen</p>
								<div className="space-y-2">
									{peraturan.documents.map((doc) => (
										<div
											key={doc.id}
											className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
										>
											<div className="flex items-center gap-3">
												<FileText className="h-5 w-5 text-muted-foreground" />
												<div>
													<p className="text-sm font-medium">{doc.file_name}</p>
													<p className="text-xs text-muted-foreground">
														{doc.mime_type} • {doc.master_doc_type.name}
													</p>
													<p className="text-xs text-muted-foreground">
														Uploaded: {new Date(doc.uploaded_at).toLocaleDateString('id-ID')}
													</p>
												</div>
											</div>
											<Button
												size="sm"
												variant="ghost"
												onClick={() =>
													handleDownload(doc.file_url || "", doc.file_name || "")
												}
											>
												Download
											</Button>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
