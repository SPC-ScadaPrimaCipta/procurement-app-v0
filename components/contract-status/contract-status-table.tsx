"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createContractStatusColumns,
	ContractStatus,
} from "./contract-status-columns";
import { ContractStatusFormDialog } from "./contract-status-form-dialog";
import { ContractStatusDeleteDialog } from "./contract-status-delete-dialog";

export function ContractStatusTable() {
	const [statuses, setStatuses] = useState<ContractStatus[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedStatus, setSelectedStatus] = useState<ContractStatus | null>(null);
	const [editingStatus, setEditingStatus] = useState<ContractStatus | null>(null);

	useEffect(() => {
		const fetchStatuses = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/contract-status");
				if (!response.ok) throw new Error("Failed to fetch statuses");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: ContractStatus) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setStatuses(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data status kontrak");
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

	const handleEdit = (status: ContractStatus) => {
		setEditingStatus(status);
		setFormDialogOpen(true);
	};

	const handleDelete = (status: ContractStatus) => {
		setSelectedStatus(status);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchStatuses();
		toast.success(
			editingStatus
				? "Status kontrak berhasil diupdate"
				: "Status kontrak berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchStatuses();
		toast.success("Status kontrak berhasil dihapus");
	};

	const columns = createContractStatusColumns({
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
						placeholder="Cari status kontrak..."
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
			<ContractStatusFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				status={editingStatus}
				onSuccess={handleFormSuccess}
			/>

			<ContractStatusDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				status={selectedStatus}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
