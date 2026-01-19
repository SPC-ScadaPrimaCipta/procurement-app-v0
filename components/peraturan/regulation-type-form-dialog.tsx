"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { RegulationType } from "./regulation-type-columns";

interface RegulationTypeFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	regulationType: RegulationType | null;
	onSuccess: () => void;
}

export function RegulationTypeFormDialog({
	open,
	onOpenChange,
	regulationType,
	onSuccess,
}: RegulationTypeFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		is_active: true,
	});

	useEffect(() => {
		if (regulationType) {
			setFormData({
				name: regulationType.name,
				is_active: regulationType.is_active,
			});
		} else {
			setFormData({
				name: "",
				is_active: true,
			});
		}
	}, [regulationType, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Nama jenis regulasi harus diisi");
			return;
		}

		setIsSubmitting(true);

		try {
			const url = regulationType
				? `/api/master/regulation-types/${regulationType.id}`
				: "/api/master/regulation-types";
			const method = regulationType ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save regulation type");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan jenis regulasi");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="pr-8">
					<DialogTitle>
						{regulationType ? "Edit Jenis Regulasi" : "Tambah Jenis Regulasi"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">
							Nama Jenis Regulasi <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="Contoh: Peraturan Pemerintah, Peraturan Menteri, Surat Edaran"
							required
						/>
					</div>

					<div className="flex items-center justify-between">
						<Label htmlFor="is_active">Status Aktif</Label>
						<Switch
							id="is_active"
							checked={formData.is_active}
							onCheckedChange={(checked) =>
								setFormData({ ...formData, is_active: checked })
							}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Menyimpan..." : "Simpan"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
