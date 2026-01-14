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
import { ReimbursementStatus } from "./reimbursement-status-columns";

interface ReimbursementStatusDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	status: ReimbursementStatus | null;
	onSuccess: () => void;
}

export function ReimbursementStatusDeleteDialog({
	open,
	onOpenChange,
	status,
	onSuccess,
}: ReimbursementStatusDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!status) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/master/reimbursement-statuses/${status.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Failed to delete status");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menghapus status reimbursement");
		} finally {
			setIsDeleting(false);
		}
	};

	if (!status) return null;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader className="pr-8">
					<DialogTitle>Hapus Status Reimbursement</DialogTitle>
					<DialogDescription>
						Apakah Anda yakin ingin menghapus status reimbursement ini? Tindakan
						ini tidak dapat dibatalkan.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="rounded-lg border p-4 space-y-2">
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Nama Status:</span>
							<span className="font-semibold">{status.name}</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm font-medium">Status:</span>
							<Badge variant={status.is_active ? "default" : "secondary"}>
								{status.is_active ? "Aktif" : "Tidak Aktif"}
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
