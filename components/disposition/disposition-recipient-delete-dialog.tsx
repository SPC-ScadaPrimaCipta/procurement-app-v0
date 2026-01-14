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
import { DispositionRecipient } from "./disposition-recipient-columns";

interface DispositionRecipientDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	recipient: DispositionRecipient | null;
	onSuccess: () => void;
}

export function DispositionRecipientDeleteDialog({
	open,
	onOpenChange,
	recipient,
	onSuccess,
}: DispositionRecipientDeleteDialogProps) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!recipient) return;

		setLoading(true);
		try {
			const response = await fetch(
				`/api/master/disposition-recipient/${recipient.id}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				throw new Error("Gagal menghapus penerima disposisi");
			}

			onSuccess();
		} catch (error) {
			toast.error("Gagal menghapus penerima disposisi");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	if (!recipient) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Hapus Penerima Disposisi</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus penerima disposisi ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="space-y-2">
						<div>
							<span className="text-sm font-medium">Nama Penerima:</span>
							<p className="text-sm text-muted-foreground">{recipient.name}</p>
						</div>
						<div>
							<span className="text-sm font-medium">Status:</span>
							<p className="text-sm text-muted-foreground">
								{recipient.is_active ? "Aktif" : "Tidak Aktif"}
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
