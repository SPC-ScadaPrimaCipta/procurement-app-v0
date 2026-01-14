"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createCaseStatusColumns,
	CaseStatus,
} from "./case-status-columns";
import { CaseStatusFormDialog } from "./case-status-form-dialog";
import { CaseStatusDeleteDialog } from "./case-status-delete-dialog";

export function CaseStatusTable() {
	const [statuses, setStatuses] = useState<CaseStatus[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<CaseStatus | null>(null);
	const [editingStatus, setEditingStatus] = useState<CaseStatus | null>(null);

	useEffect(() => {
		const fetchStatuses = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/case-status");
				if (!response.ok) throw new Error("Failed to fetch statuses");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: CaseStatus) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setStatuses(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data status pengadaan");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchStatuses();
	}, [refreshTrigger, searchQuery]);

	const refetchStatuses = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingStatus(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (status: CaseStatus) => {
		setEditingStatus(status);
		setFormDialogOpen(true);
	};

	const handleDelete = (status: CaseStatus) => {
		setSelectedStatus(status);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchStatuses();
		toast.success(
			editingStatus
				? "Status pengadaan berhasil diupdate"
				: "Status pengadaan berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchStatuses();
		toast.success("Status pengadaan berhasil dihapus");
	};

	const columns = createCaseStatusColumns({
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
						placeholder="Cari status pengadaan..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Status
				</Button>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={statuses} />

			{/* Dialogs */}
			<CaseStatusFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				status={editingStatus}
				onSuccess={handleFormSuccess}
			/>

			<CaseStatusDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				status={selectedStatus}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
