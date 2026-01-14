"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
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

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: DispositionRecipient) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setRecipients(filteredData);
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

	const columns = createDispositionRecipientColumns({
		onEdit: handleEdit,
		onDelete: handleDelete,
	});

	return (
		<>
			{/* Actions Bar */}
			<div className="flex items-center justify-between">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Cari penerima disposisi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Penerima
				</Button>
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
