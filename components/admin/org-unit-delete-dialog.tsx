"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OrgUnit } from "./org-unit-columns";

interface OrgUnitDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	orgUnit: OrgUnit | null;
	onSuccess: () => void;
}

export function OrgUnitDeleteDialog({
	open,
	onOpenChange,
	orgUnit,
	onSuccess,
}: OrgUnitDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!orgUnit) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/master/org-unit/${orgUnit.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to delete org unit");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menghapus unit organisasi");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!orgUnit) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader className="pr-8">
					<DialogTitle>Hapus Unit Organisasi</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus unit organisasi ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Nama Unit:</span>
							<span className="font-semibold">{orgUnit.unit_name}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Tipe Unit:</span>
							<span>{orgUnit.unit_type}</span>
						</div>
						{orgUnit.unit_code && (
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Kode Unit:</span>
								<span>{orgUnit.unit_code}</span>
							</div>
						)}
						{orgUnit.parent && (
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">Unit Parent:</span>
								<span>{orgUnit.parent.unit_name}</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Status:</span>
							<Badge variant={orgUnit.is_active ? "default" : "secondary"}>
								{orgUnit.is_active ? "Aktif" : "Tidak Aktif"}
							</Badge>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Batal
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Menghapus..." : "Hapus"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
