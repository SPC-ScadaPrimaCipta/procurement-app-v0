"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VendorDeleteDialogProps {
	vendor: {
		id: string;
		vendor_name: string;
	} | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function VendorDeleteDialog({
	vendor,
	open,
	onOpenChange,
	onSuccess,
}: VendorDeleteDialogProps) {
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = async () => {
		if (!vendor) return;

		setIsDeleting(true);

		try {
			const response = await fetch(`/api/vendors/${vendor.id}`, {
				method: "DELETE",
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to delete vendor");
			}

			toast.success("Vendor deleted successfully");
			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete vendor"
			);
		} finally {
			setIsDeleting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Delete Vendor</DialogTitle>
					<DialogDescription>
						Are you sure you want to delete vendor{" "}
						<span className="font-semibold">{vendor?.vendor_name}</span>?
						<br />
						<br />
						This action cannot be undone. The vendor will be deactivated.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isDeleting}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						onClick={handleDelete}
						disabled={isDeleting}
					>
						{isDeleting ? "Deleting..." : "Delete"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
