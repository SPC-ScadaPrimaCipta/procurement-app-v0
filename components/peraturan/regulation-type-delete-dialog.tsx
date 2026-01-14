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
import { RegulationType } from "./regulation-type-columns";

interface RegulationTypeDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	regulationType: RegulationType | null;
	onSuccess: () => void;
}

export function RegulationTypeDeleteDialog({
	open,
	onOpenChange,
	regulationType,
	onSuccess,
}: RegulationTypeDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!regulationType) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/master/regulation-types/${regulationType.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to delete regulation type");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menghapus jenis regulasi");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!regulationType) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader className="pr-8">
					<DialogTitle>Hapus Jenis Regulasi</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus jenis regulasi ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Nama Jenis Regulasi:</span>
							<span className="font-semibold">{regulationType.name}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Urutan:</span>
							<span>{regulationType.sort_order}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Status:</span>
							<Badge variant={regulationType.is_active ? "default" : "secondary"}>
								{regulationType.is_active ? "Aktif" : "Tidak Aktif"}
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
