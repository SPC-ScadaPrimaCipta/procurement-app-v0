"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { DispositionRecipient } from "./disposition-recipient-columns";

interface DispositionRecipientFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	recipient: DispositionRecipient | null;
	onSuccess: () => void;
}

export function DispositionRecipientFormDialog({
	open,
	onOpenChange,
	recipient,
	onSuccess,
}: DispositionRecipientFormDialogProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		is_active: true,
		sort_order: 0,
	});

	useEffect(() => {
		if (recipient) {
			setFormData({
				name: recipient.name,
				is_active: recipient.is_active,
				sort_order: recipient.sort_order,
			});
		} else {
			setFormData({
				name: "",
				is_active: true,
				sort_order: 0,
			});
		}
	}, [recipient, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Nama penerima wajib diisi");
			return;
		}

		setLoading(true);
		try {
			const url = recipient
				? `/api/master/disposition-recipient/${recipient.id}`
				: "/api/master/disposition-recipient";

			const response = await fetch(url, {
				method: recipient ? "PUT" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Gagal menyimpan data");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan data");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{recipient ? "Edit Penerima Disposisi" : "Tambah Penerima Disposisi"}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Nama */}
						<div className="space-y-2">
							<Label htmlFor="name">
								Nama Penerima <span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Contoh: Kabag Perencanaan"
								required
							/>
						</div>

						{/* Sort Order */}
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
								min="0"
							/>
							<p className="text-xs text-muted-foreground">
								Urutan tampilan dalam daftar (semakin kecil semakin atas)
							</p>
						</div>

						{/* Is Active */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="is_active">Status Aktif</Label>
								<p className="text-xs text-muted-foreground">
									Penerima aktif akan muncul dalam form disposisi
								</p>
							</div>
							<Switch
								id="is_active"
								checked={formData.is_active}
								onCheckedChange={(checked) =>
									setFormData({ ...formData, is_active: checked })
								}
							/>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Batal
						</Button>
						<Button type="submit" disabled={loading}>
							{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							{recipient ? "Update" : "Simpan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
