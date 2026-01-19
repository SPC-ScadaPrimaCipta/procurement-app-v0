"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	createDispositionRecipientColumns,
	DispositionRecipient,
} from "./disposition-recipient-columns";
import { DispositionRecipientFormDialog } from "./disposition-recipient-form-dialog";
import { DispositionRecipientDeleteDialog } from "./disposition-recipient-delete-dialog";

export function DispositionRecipientTable() {
	const [recipients, setRecipients] = useState<DispositionRecipient[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedRecipient, setSelectedRecipient] =
		useState<DispositionRecipient | null>(null);
	const [editingRecipient, setEditingRecipient] =
		useState<DispositionRecipient | null>(null);

	useEffect(() => {
		const fetchRecipients = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/disposition-recipient");
				if (!response.ok) {
					const errorText = await response.text();
					console.error("API Error:", response.status, errorText);
					throw new Error("Failed to fetch recipients");
				}

				const data = await response.json();
				console.log("Recipients data:", data);

				// Sort by sort_order first
				const sortedData = data.sort((a: DispositionRecipient, b: DispositionRecipient) => 
					a.sort_order - b.sort_order
				);

				// Filter by search query if exists
				let filteredData = sortedData;
				if (searchQuery) {
					filteredData = sortedData.filter((item: DispositionRecipient) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setRecipients(filteredData);
				setHasChanges(false);
			} catch (error) {
				toast.error("Gagal memuat data penerima disposisi");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchRecipients();
	}, [refreshTrigger]);

	const refetchRecipients = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingRecipient(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (recipient: DispositionRecipient) => {
		setEditingRecipient(recipient);
		setFormDialogOpen(true);
	};

	const handleDelete = (recipient: DispositionRecipient) => {
		setSelectedRecipient(recipient);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchRecipients();
		toast.success(
			editingRecipient
				? "Penerima disposisi berhasil diupdate"
				: "Penerima disposisi berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchRecipients();
		toast.success("Penerima disposisi berhasil dihapus");
	};

	const handleMoveUp = (recipient: DispositionRecipient) => {
		const currentIndex = recipients.findIndex((r) => r.id === recipient.id);
		if (currentIndex <= 0) return;

		const newRecipients = [...recipients];
		[newRecipients[currentIndex - 1], newRecipients[currentIndex]] = [
			newRecipients[currentIndex],
			newRecipients[currentIndex - 1],
		];

		// Update sort_order based on new index
		const reordered = newRecipients.map((r, idx) => ({
			...r,
			sort_order: idx + 1,
		}));

		setRecipients(reordered);
		setHasChanges(true);
	};

	const handleMoveDown = (recipient: DispositionRecipient) => {
		const currentIndex = recipients.findIndex((r) => r.id === recipient.id);
		if (currentIndex >= recipients.length - 1) return;

		const newRecipients = [...recipients];
		[newRecipients[currentIndex + 1], newRecipients[currentIndex]] = [
			newRecipients[currentIndex],
			newRecipients[currentIndex + 1],
		];

		// Update sort_order based on new index
		const reordered = newRecipients.map((r, idx) => ({
			...r,
			sort_order: idx + 1,
		}));

		setRecipients(reordered);
		setHasChanges(true);
	};

	const canMoveUp = (recipient: DispositionRecipient) => {
		const index = recipients.findIndex((r) => r.id === recipient.id);
		return index > 0;
	};

	const canMoveDown = (recipient: DispositionRecipient) => {
		const index = recipients.findIndex((r) => r.id === recipient.id);
		return index < recipients.length - 1;
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const response = await fetch("/api/master/disposition-recipient/reorder", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ recipients }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Gagal menyimpan perubahan");
			}

			toast.success("Urutan berhasil disimpan");
			setHasChanges(false);
			refetchRecipients();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan perubahan");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const columns = createDispositionRecipientColumns({
		onEdit: handleEdit,
		onDelete: handleDelete,
		onMoveUp: handleMoveUp,
		onMoveDown: handleMoveDown,
		canMoveUp,
		canMoveDown,
	});

	return (
		<>
			{/* Actions Bar */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
				<div className="relative flex-1 max-w-sm w-full">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Cari penerima disposisi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2 w-full sm:w-auto">
					{hasChanges && (
						<Button
							variant="default"
							onClick={handleSaveChanges}
							disabled={isSaving || isLoading}
							className="w-full sm:w-auto"
						>
							{isSaving ? (
								<>
									<Loader2 className="h-4 w-4 mr-2 animate-spin" />
									Menyimpan...
								</>
							) : (
								<>
									<Save className="h-4 w-4 mr-2" />
									Save Changes
								</>
							)}
						</Button>
					)}
					<Button onClick={handleAddNew} className="w-full sm:w-auto">
						<Plus className="h-4 w-4 mr-2" />
						Tambah Penerima
					</Button>
				</div>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={recipients} />

			{/* Dialogs */}
			<DispositionRecipientFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				recipient={editingRecipient}
				onSuccess={handleFormSuccess}
			/>

			<DispositionRecipientDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				recipient={selectedRecipient}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
