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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { OrgUnit } from "./org-unit-columns";

interface OrgUnitFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orgUnit: OrgUnit | null;
	orgUnits: OrgUnit[];
	onSuccess: () => void;
}

export function OrgUnitFormDialog({
	open,
	onOpenChange,
	orgUnit,
	orgUnits,
	onSuccess,
}: OrgUnitFormDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [formData, setFormData] = useState({
		unit_type: "",
		unit_code: "",
		unit_name: "",
		parent_unit_id: "",
		is_active: true,
	});

	useEffect(() => {
		if (orgUnit) {
			setFormData({
				unit_type: orgUnit.unit_type,
				unit_code: orgUnit.unit_code || "",
				unit_name: orgUnit.unit_name,
				parent_unit_id: orgUnit.parent_unit_id || "",
				is_active: orgUnit.is_active,
			});
		} else {
			setFormData({
				unit_type: "",
				unit_code: "",
				unit_name: "",
				parent_unit_id: "",
				is_active: true,
			});
		}
	}, [orgUnit, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.unit_type.trim()) {
			toast.error("Tipe unit harus diisi");
			return;
		}

		if (!formData.unit_name.trim()) {
			toast.error("Nama unit harus diisi");
			return;
		}

		setIsSubmitting(true);

		try {
			const url = orgUnit
				? `/api/master/org-unit/${orgUnit.id}`
				: "/api/master/org-unit";
			const method = orgUnit ? "PUT" : "POST";

			const payload = {
				...formData,
				parent_unit_id: formData.parent_unit_id || null,
				unit_code: formData.unit_code || null,
			};

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to save org unit");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan unit organisasi");
		} finally {
			setIsSubmitting(false);
		}
	};

	// Filter out current unit from parent options to prevent self-reference
	const availableParents = orgUnits.filter(u => u.id !== orgUnit?.id);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader className="pr-8">
					<DialogTitle>
						{orgUnit ? "Edit Unit Organisasi" : "Tambah Unit Organisasi"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="unit_name">
							Nama Unit <span className="text-destructive">*</span>
						</Label>
						<Input
							id="unit_name"
							value={formData.unit_name}
							onChange={(e) =>
								setFormData({ ...formData, unit_name: e.target.value })
							}
							placeholder="Contoh: Direktorat Keuangan, Divisi IT"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="unit_type">
							Tipe Unit <span className="text-destructive">*</span>
						</Label>
						<Input
							id="unit_type"
							value={formData.unit_type}
							onChange={(e) =>
								setFormData({ ...formData, unit_type: e.target.value })
							}
							placeholder="Contoh: Direktorat, Divisi, Departemen, Seksi"
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="unit_code">Kode Unit</Label>
						<Input
							id="unit_code"
							value={formData.unit_code}
							onChange={(e) =>
								setFormData({ ...formData, unit_code: e.target.value })
							}
							placeholder="Contoh: DIR-KEU, DIV-IT"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="parent_unit_id">Unit Parent</Label>
						<Select
							value={formData.parent_unit_id || "none"}
							onValueChange={(value) =>
								setFormData({ ...formData, parent_unit_id: value === "none" ? "" : value })
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih unit parent (opsional)" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">- Tidak ada parent -</SelectItem>
								{availableParents.map((unit) => (
									<SelectItem key={unit.id} value={unit.id}>
										{unit.unit_name} ({unit.unit_type})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
