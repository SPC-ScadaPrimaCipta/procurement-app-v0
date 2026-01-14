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
import { ContractStatus } from "./contract-status-columns";

interface ContractStatusFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status: ContractStatus | null;
	onSuccess: () => void;
}

export function ContractStatusFormDialog({
	open,
	onOpenChange,
	status,
	onSuccess,
}: ContractStatusFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		sort_order: 0,
		is_active: true,
	});

	useEffect(() => {
		if (status) {
			setFormData({
				name: status.name,
				sort_order: status.sort_order,
				is_active: status.is_active,
			});
		} else {
			setFormData({
				name: "",
				sort_order: 0,
				is_active: true,
			});
		}
	}, [status, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Nama status harus diisi");
			return;
		}

		setIsSubmitting(true);

		try {
			const url = status
				? `/api/master/contract-status/${status.id}`
				: "/api/master/contract-status";
			const method = status ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save status");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan status kontrak");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="pr-8">
					<DialogTitle>
						{status ? "Edit Status Kontrak" : "Tambah Status Kontrak"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="name">
							Nama Status <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							placeholder="Contoh: Aktif, Selesai, Dibatalkan"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="sort_order">Urutan</Label>
						<Input
							id="sort_order"
							type="number"
							value={formData.sort_order}
							onChange={(e) =>
								setFormData({
									...formData,
									sort_order: parseInt(e.target.value) || 0,
								})
							}
							placeholder="0"
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
