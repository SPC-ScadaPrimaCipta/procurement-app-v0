"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createReimbursementStatusColumns,
	ReimbursementStatus,
} from "./reimbursement-status-columns";
import { ReimbursementStatusFormDialog } from "./reimbursement-status-form-dialog";
import { ReimbursementStatusDeleteDialog } from "./reimbursement-status-delete-dialog";

export function ReimbursementStatusTable() {
	const [statuses, setStatuses] = useState<ReimbursementStatus[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<ReimbursementStatus | null>(null);
	const [editingStatus, setEditingStatus] = useState<ReimbursementStatus | null>(null);

	useEffect(() => {
		const fetchStatuses = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/reimbursement-statuses");
				if (!response.ok) throw new Error("Failed to fetch statuses");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: ReimbursementStatus) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setStatuses(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data status reimbursement");
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

	const handleEdit = (status: ReimbursementStatus) => {
		setEditingStatus(status);
		setFormDialogOpen(true);
	};

	const handleDelete = (status: ReimbursementStatus) => {
		setSelectedStatus(status);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchStatuses();
		toast.success(
			editingStatus
				? "Status reimbursement berhasil diupdate"
				: "Status reimbursement berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchStatuses();
		toast.success("Status reimbursement berhasil dihapus");
	};

	const columns = createReimbursementStatusColumns({
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
						placeholder="Cari status reimbursement..."
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
			<ReimbursementStatusFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				status={editingStatus}
				onSuccess={handleFormSuccess}
			/>

			<ReimbursementStatusDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				status={selectedStatus}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
