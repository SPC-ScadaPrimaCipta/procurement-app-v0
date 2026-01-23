"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CaseStatus {
	id: string;
	name: string;
}

interface StatusUpdateDialogProps {
	isOpen: boolean;
	onClose: () => void;
	caseId: string;
	currentStatusId: string;
	onSuccess: () => void;
}

export function StatusUpdateDialog({
	isOpen,
	onClose,
	caseId,
	currentStatusId,
	onSuccess,
}: StatusUpdateDialogProps) {
	const [statuses, setStatuses] = useState<CaseStatus[]>([]);
	const [selectedStatus, setSelectedStatus] =
		useState<string>(currentStatusId);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		if (isOpen) {
			fetchStatuses();
			setSelectedStatus(currentStatusId);
		}
	}, [isOpen, currentStatusId]);

	const fetchStatuses = async () => {
		setIsLoading(true);
		try {
			const res = await fetch("/api/master/case-status");
			if (!res.ok) throw new Error("Failed to fetch statuses");
			const data = await res.json();
			setStatuses(data);
		} catch (error) {
			console.error(error);
			toast.error("Gagal memuat daftar status");
		} finally {
			setIsLoading(false);
		}
	};

	const handleSave = async () => {
		if (!selectedStatus) return;

		setIsSaving(true);
		try {
			const res = await fetch(`/api/procurement-cases/${caseId}/status`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ statusId: selectedStatus }),
			});

			if (!res.ok) throw new Error("Failed to update status");

			toast.success("Status berhasil diperbarui");
			onSuccess();
			onClose();
		} catch (error) {
			console.error(error);
			toast.error("Gagal memperbarui status");
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Update Status Pengadaan</DialogTitle>
					<DialogDescription>
						Ubah status pengadaan secara manual.
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid grid-cols-4 items-center gap-4">
						<Label htmlFor="status" className="text-right">
							Status
						</Label>
						<div className="col-span-3">
							{isLoading ? (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<Loader2 className="h-4 w-4 animate-spin" />{" "}
									Loading...
								</div>
							) : (
								<Select
									value={selectedStatus}
									onValueChange={setSelectedStatus}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Pilih status" />
									</SelectTrigger>
									<SelectContent>
										{statuses.map((status) => (
											<SelectItem
												key={status.id}
												value={status.id}
											>
												{status.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={onClose}
						disabled={isSaving}
					>
						Batal
					</Button>
					<Button
						onClick={handleSave}
						disabled={
							isSaving ||
							isLoading ||
							selectedStatus === currentStatusId
						}
					>
						{isSaving ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
								Menyimpan
							</>
						) : (
							"Simpan"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
