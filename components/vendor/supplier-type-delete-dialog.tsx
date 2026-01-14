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
import { SupplierType } from "./supplier-type-columns";

interface SupplierTypeDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	supplierType: SupplierType | null;
	onSuccess: () => void;
}

export function SupplierTypeDeleteDialog({
	open,
	onOpenChange,
	supplierType,
	onSuccess,
}: SupplierTypeDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!supplierType) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/master/supplier-types/${supplierType.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to delete supplier type");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menghapus jenis vendor");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!supplierType) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader className="pr-8">
					<DialogTitle>Hapus Jenis Vendor</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus jenis vendor ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Nama Jenis Vendor:</span>
							<span className="font-semibold">{supplierType.name}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Status:</span>
							<Badge variant={supplierType.is_active ? "default" : "secondary"}>
								{supplierType.is_active ? "Aktif" : "Tidak Aktif"}
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
