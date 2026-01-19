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
import { DispositionAction } from "./disposition-action-columns";

interface DispositionActionFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	action: DispositionAction | null;
	onSuccess: () => void;
}

export function DispositionActionFormDialog({
	open,
	onOpenChange,
	action,
	onSuccess,
}: DispositionActionFormDialogProps) {
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		is_active: true,
		sort_order: 0,
	});

	useEffect(() => {
		if (action) {
			setFormData({
				name: action.name,
				is_active: action.is_active,
				sort_order: action.sort_order,
			});
		} else {
			setFormData({
				name: "",
				is_active: true,
				sort_order: 0,
			});
		}
	}, [action, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			toast.error("Nama instruksi wajib diisi");
			return;
		}

		setLoading(true);
		try {
			const url = action
				? `/api/master/disposition-action/${action.id}`
				: "/api/master/disposition-action";

			const response = await fetch(url, {
				method: action ? "PUT" : "POST",
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
							{action ? "Edit Instruksi Disposisi" : "Tambah Instruksi Disposisi"}
						</DialogTitle>
					</DialogHeader>

					<div className="space-y-4 py-4">
						{/* Nama */}
						<div className="space-y-2">
							<Label htmlFor="name">
								Nama Instruksi <span className="text-red-500">*</span>
							</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Contoh: Proses lebih lanjut"
								required
							/>
						</div>

						{/* Is Active */}
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label htmlFor="is_active">Status Aktif</Label>
								<p className="text-xs text-muted-foreground">
									Instruksi aktif akan muncul dalam form disposisi
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
							{action ? "Update" : "Simpan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
