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
import { ProcurementMethod } from "./procurement-method-columns";

interface ProcurementMethodFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	procurementMethod: ProcurementMethod | null;
	onSuccess: () => void;
}

export function ProcurementMethodFormDialog({
	open,
	onOpenChange,
	procurementMethod,
	onSuccess,
}: ProcurementMethodFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		is_active: true,
	});

	useEffect(() => {
		if (procurementMethod) {
			setFormData({
				name: procurementMethod.name,
				is_active: procurementMethod.is_active,
			});
		} else {
			setFormData({
				name: "",
				is_active: true,
			});
		}
	}, [procurementMethod, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Nama metode pengadaan harus diisi");
			return;
		}

		setIsSubmitting(true);

		try {
			const url = procurementMethod
				? `/api/master/procurement-method/${procurementMethod.id}`
				: "/api/master/procurement-method";
			const method = procurementMethod ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save procurement method");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan metode pengadaan");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="pr-8">
					<DialogTitle>
						{procurementMethod ? "Edit metode Pengadaan" : "Tambah metode Pengadaan"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">
							Nama metode Pengadaan <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="Contoh: Lelang Umum, Penunjukan Langsung, Pengadaan Langsung"
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
