"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createDispositionActionColumns,
	DispositionAction,
} from "./disposition-action-columns";
import { DispositionActionFormDialog } from "./disposition-action-form-dialog";
import { DispositionActionDeleteDialog } from "./disposition-action-delete-dialog";

export function DispositionActionTable() {
	const [actions, setActions] = useState<DispositionAction[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedAction, setSelectedAction] = useState<DispositionAction | null>(null);
	const [editingAction, setEditingAction] = useState<DispositionAction | null>(null);

	useEffect(() => {
		const fetchActions = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/disposition-action");
				if (!response.ok) throw new Error("Failed to fetch actions");

				const data = await response.json();
				
				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: DispositionAction) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}
				
				setActions(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data instruksi disposisi");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchActions();
	}, [refreshTrigger]);

	const refetchActions = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingAction(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (action: DispositionAction) => {
		setEditingAction(action);
		setFormDialogOpen(true);
	};

	const handleDelete = (action: DispositionAction) => {
		setSelectedAction(action);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchActions();
		toast.success(
			editingAction
				? "Instruksi disposisi berhasil diupdate"
				: "Instruksi disposisi berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchActions();
		toast.success("Instruksi disposisi berhasil dihapus");
	};

	const columns = createDispositionActionColumns({
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
						placeholder="Cari instruksi disposisi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Instruksi
				</Button>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={actions} />

			{/* Dialogs */}
			<DispositionActionFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				action={editingAction}
				onSuccess={handleFormSuccess}
			/>

			<DispositionActionDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				action={selectedAction}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
