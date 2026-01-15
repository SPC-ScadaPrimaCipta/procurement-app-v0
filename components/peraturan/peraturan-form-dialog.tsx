"use client";

import { useState, useEffect } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Peraturan } from "./peraturan-columns";

interface PeraturanFormData {
	type_id: string;
	doc_number: string;
	title: string;
	file?: FileList;
}

interface RegulationType {
	id: string;
	name: string;
}

interface PeraturanFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	peraturan?: Peraturan | null;
	onSuccess: () => void;
}

export function PeraturanFormDialog({
	open,
	onOpenChange,
	peraturan,
	onSuccess,
}: PeraturanFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
	const [selectedTypeId, setSelectedTypeId] = useState<string>("");
	const isEdit = !!peraturan;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<PeraturanFormData>();

	useEffect(() => {
		fetchRegulationTypes();
	}, []);

	useEffect(() => {
		if (open && peraturan) {
			reset({
				type_id: peraturan.type?.name || "",
				doc_number: peraturan.doc_number,
				title: peraturan.title,
			});
			// Find type_id from name
			const type = regulationTypes.find((t) => t.name === peraturan.type?.name);
			if (type) {
				setSelectedTypeId(type.id);
			}
		} else if (open && !peraturan) {
			reset({
				type_id: "",
				doc_number: "",
				title: "",
			});
			setSelectedTypeId("");
		}
	}, [open, peraturan, reset, regulationTypes]);

	const fetchRegulationTypes = async () => {
		try {
			const response = await fetch("/api/master/regulation-types");
			if (!response.ok) throw new Error("Failed to fetch regulation types");

			const data = await response.json();
			setRegulationTypes(data);
		} catch (error) {
			toast.error("Failed to load regulation types");
			console.error(error);
		}
	};

	const onSubmit = async (data: PeraturanFormData) => {
		if (!selectedTypeId) {
			toast.error("Tipe dokumen wajib dipilih");
			return;
		}

		setIsLoading(true);

		try {
			// Create or update regulation
			const regulationData = {
				type_id: selectedTypeId,
				doc_number: data.doc_number,
				title: data.title,
			};

			const url = isEdit ? `/api/peraturan/${peraturan.id}` : "/api/peraturan";
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(regulationData),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to save peraturan");
			}

			// Upload file if provided (using document table)
			if (data.file && data.file.length > 0) {
				const formData = new FormData();
				formData.append("file", data.file[0]);

				const uploadResponse = await fetch(
					`/api/peraturan/${result.id}/documents`,
					{
						method: "POST",
						body: formData,
					}
				);

				if (!uploadResponse.ok) {
					throw new Error("Failed to upload document");
				}
			}

			toast.success(
				isEdit
					? "Peraturan updated successfully"
					: "Peraturan added successfully"
			);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save peraturan"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Peraturan" : "Tambah Peraturan"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* Type */}
					<div className="space-y-2">
						<Label htmlFor="type_id">
							Tipe Dokumen <span className="text-red-500">*</span>
						</Label>
						<Select
							value={selectedTypeId}
							onValueChange={setSelectedTypeId}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih tipe dokumen" />
							</SelectTrigger>
							<SelectContent>
								{regulationTypes.map((type) => (
									<SelectItem key={type.id} value={type.id}>
										{type.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Document Number */}
					<div className="space-y-2">
						<Label htmlFor="doc_number">
							Nomor Dokumen <span className="text-red-500">*</span>
						</Label>
						<Input
							id="doc_number"
							placeholder="Contoh: 123 TAHUN 2024"
							{...register("doc_number", {
								required: "Nomor dokumen wajib diisi",
							})}
						/>
						{errors.doc_number && (
							<p className="text-sm text-red-500">
								{errors.doc_number.message}
							</p>
						)}
					</div>

					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="title">
							Judul Dokumen <span className="text-red-500">*</span>
						</Label>
						<Input
							id="title"
							placeholder="Judul peraturan"
							{...register("title", {
								required: "Judul dokumen wajib diisi",
							})}
						/>
						{errors.title && (
							<p className="text-sm text-red-500">{errors.title.message}</p>
						)}
					</div>

					{/* File Upload */}
					<div className="space-y-2">
						<Label htmlFor="file">
							Lampiran Dokumen {!isEdit && <span className="text-red-500">*</span>}
						</Label>
						<Input
							id="file"
							type="file"
							accept=".pdf,.doc,.docx"
							{...register("file", {
								required: isEdit ? false : "File wajib diupload",
							})}
						/>
						{errors.file && (
							<p className="text-sm text-red-500">{errors.file.message}</p>
						)}
						<p className="text-xs text-muted-foreground">
							Format yang didukung: PDF, DOC, DOCX
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
