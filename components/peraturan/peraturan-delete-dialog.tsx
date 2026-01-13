"use client";

import { useState } from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Peraturan } from "./peraturan-columns";

interface PeraturanDeleteDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	peraturan: Peraturan | null;
	onSuccess: () => void;
}

export function PeraturanDeleteDialog({
	open,
	onOpenChange,
	peraturan,
	onSuccess,
}: PeraturanDeleteDialogProps) {
	const [isLoading, setIsLoading] = useState(false);

	const handleDelete = async () => {
		if (!peraturan) return;

		setIsLoading(true);

		try {
			const response = await fetch(`/api/peraturan/${peraturan.id}`, {
				method: "DELETE",
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete peraturan");
			}

			toast.success("Peraturan deleted successfully");
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete peraturan"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Hapus Peraturan?</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan. Peraturan{" "}
						<span className="font-semibold">{peraturan?.doc_number}</span> akan
						dihapus secara permanen beserta semua lampiran dokumennya.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						disabled={isLoading}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isLoading ? "Menghapus..." : "Hapus"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
