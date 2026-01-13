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
import { type Reimbursement } from "./reimbursement-columns";

interface ReimbursementDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reimbursement: Reimbursement | null;
	onSuccess: () => void;
}

export function ReimbursementDeleteDialog({
	open,
	onOpenChange,
	reimbursement,
	onSuccess,
}: ReimbursementDeleteDialogProps) {
	const [loading, setLoading] = useState(false);

	const handleDelete = async () => {
		if (!reimbursement) return;

		setLoading(true);
		try {
			const response = await fetch(`/api/reimbursement/${reimbursement.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				throw new Error("Failed to delete reimbursement");
			}

			onSuccess();
		} catch (error) {
			toast.error("Gagal menghapus reimbursement");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	if (!reimbursement) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Hapus Reimbursement</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus reimbursement ini? Tindakan ini
						tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="py-4">
					<div className="space-y-2">
						<div>
							<span className="text-sm font-medium">No Reimbursement:</span>
							<p className="text-sm text-muted-foreground">
								{reimbursement.reimbursement_no}
							</p>
						</div>
						<div>
							<span className="text-sm font-medium">Nama Penyedia:</span>
							<p className="text-sm text-muted-foreground">
								{reimbursement.vendor.vendor_name}
							</p>
						</div>
						<div>
							<span className="text-sm font-medium">Nilai Kwitansi:</span>
							<p className="text-sm text-muted-foreground">
								{new Intl.NumberFormat("id-ID", {
									style: "currency",
									currency: "IDR",
									minimumFractionDigits: 0,
								}).format(reimbursement.nilai_kwitansi)}
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
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={loading}
					>
						{loading ? "Menghapus..." : "Hapus"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
