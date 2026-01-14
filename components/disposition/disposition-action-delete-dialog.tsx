"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { DispositionAction } from "./disposition-action-columns";

interface DispositionActionDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	action: DispositionAction | null;
	onSuccess: () => void;
}

export function DispositionActionDeleteDialog({
	open,
	onOpenChange,
	action,
	onSuccess,
}: DispositionActionDeleteDialogProps) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!action) return;

		setLoading(true);
		try {
			const response = await fetch(`/api/master/disposition-action/${action.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Gagal menghapus instruksi disposisi");
			}

			onSuccess();
		} catch (error) {
			toast.error("Gagal menghapus instruksi disposisi");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	if (!action) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Hapus Instruksi Disposisi</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus instruksi disposisi ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="space-y-2">
						<div>
							<span className="text-sm font-medium">Nama Instruksi:</span>
							<p className="text-sm text-muted-foreground">{action.name}</p>
						</div>
						<div>
							<span className="text-sm font-medium">Status:</span>
							<p className="text-sm text-muted-foreground">
								{action.is_active ? "Aktif" : "Tidak Aktif"}
							</p>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={loading}
					>
						Batal
					</Button>
					<Button variant="destructive" onClick={handleDelete} disabled={loading}>
						{loading ? "Menghapus..." : "Hapus"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
