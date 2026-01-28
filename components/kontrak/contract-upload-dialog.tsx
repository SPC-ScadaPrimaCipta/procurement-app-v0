"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface ContractUploadDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	docTypes: { id: string; name: string }[];
	onUpload: (file: File, docTypeId: string, docTypeName: string) => void;
}

export function ContractUploadDialog({
	open,
	onOpenChange,
	docTypes,
	onUpload,
}: ContractUploadDialogProps) {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [selectedDocType, setSelectedDocType] = useState<string>("");

	const handleSave = () => {
		if (!selectedFile || !selectedDocType) return;
		const docTypeName =
			docTypes.find((d) => d.id === selectedDocType)?.name || "-";
		onUpload(selectedFile, selectedDocType, docTypeName);
		// Reset
		setSelectedFile(null);
		setSelectedDocType("");
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Upload Dokumen</DialogTitle>
					<DialogDescription>
						Pilih jenis dokumen dan file yang akan diupload.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<label className="text-sm font-medium">
							Jenis Dokumen
						</label>
						<Select
							value={selectedDocType}
							onValueChange={setSelectedDocType}
						>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Pilih Jenis Dokumen" />
							</SelectTrigger>
							<SelectContent>
								{docTypes.map((type) => (
									<SelectItem key={type.id} value={type.id}>
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<label className="text-sm font-medium">File</label>
						<div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors cursor-pointer relative">
							<Input
								type="file"
								className="absolute inset-0 opacity-0 cursor-pointer"
								onChange={(e) => {
									if (
										e.target.files &&
										e.target.files.length > 0
									) {
										setSelectedFile(e.target.files[0]);
									}
								}}
							/>
							<div className="bg-primary/10 p-3 rounded-full mb-3">
								<Upload className="w-6 h-6 text-primary" />
							</div>
							{selectedFile ? (
								<div className="text-sm">
									<p className="font-medium text-primary">
										{selectedFile.name}
									</p>
									<p className="text-muted-foreground mt-1 text-xs">
										{(selectedFile.size / 1024).toFixed(0)}{" "}
										KB
									</p>
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									<p className="font-medium text-foreground">
										Klik untuk memilih file
									</p>
									<p>atau drag & drop file disini</p>
								</div>
							)}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="ghost" onClick={() => onOpenChange(false)}>
						Batal
					</Button>
					<Button
						onClick={handleSave}
						disabled={!selectedFile || !selectedDocType}
					>
						Tambahkan
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
