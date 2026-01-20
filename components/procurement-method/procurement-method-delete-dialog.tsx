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
import { ProcurementMethod } from "./procurement-method-columns";

interface ProcurementMethodDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	procurementMethod: ProcurementMethod | null;
	onSuccess: () => void;
}

export function ProcurementMethodDeleteDialog({
	open,
	onOpenChange,
	procurementMethod,
	onSuccess,
}: ProcurementMethodDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!procurementMethod) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/master/procurement-method/${procurementMethod.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to delete procurement method");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menghapus metode pengadaan");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!procurementMethod) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader className="pr-8">
					<DialogTitle>Hapus metode Pengadaan</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus metode pengadaan ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Nama metode Pengadaan:</span>
							<span className="font-semibold">{procurementMethod.name}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Urutan:</span>
							<span>{procurementMethod.sort_order}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Status:</span>
							<Badge variant={procurementMethod.is_active ? "default" : "secondary"}>
								{procurementMethod.is_active ? "Aktif" : "Tidak Aktif"}
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
