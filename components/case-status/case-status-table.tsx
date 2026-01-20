"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Loader2 } from "lucide-react";
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
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
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

				// Sort by sort_order first
				const sortedData = data.sort((a: CaseStatus, b: CaseStatus) => 
					a.sort_order - b.sort_order
				);

				// Filter by search query if exists
				let filteredData = sortedData;
				if (searchQuery) {
					filteredData = sortedData.filter((item: CaseStatus) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setStatuses(filteredData);
				setHasChanges(false);
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

	const handleMoveUp = (status: CaseStatus) => {
		const currentIndex = statuses.findIndex((s) => s.id === status.id);
		if (currentIndex <= 0) return;

		const newStatuses = [...statuses];
		[newStatuses[currentIndex - 1], newStatuses[currentIndex]] = [
			newStatuses[currentIndex],
			newStatuses[currentIndex - 1],
		];

		// Update sort_order based on new index
		const reordered = newStatuses.map((s, idx) => ({
			...s,
			sort_order: idx + 1,
		}));

		setStatuses(reordered);
		setHasChanges(true);
	};

	const handleMoveDown = (status: CaseStatus) => {
		const currentIndex = statuses.findIndex((s) => s.id === status.id);
		if (currentIndex >= statuses.length - 1) return;

		const newStatuses = [...statuses];
		[newStatuses[currentIndex + 1], newStatuses[currentIndex]] = [
			newStatuses[currentIndex],
			newStatuses[currentIndex + 1],
		];

		// Update sort_order based on new index
		const reordered = newStatuses.map((s, idx) => ({
			...s,
			sort_order: idx + 1,
		}));

		setStatuses(reordered);
		setHasChanges(true);
	};

	const canMoveUp = (status: CaseStatus) => {
		const index = statuses.findIndex((s) => s.id === status.id);
		return index > 0;
	};

	const canMoveDown = (status: CaseStatus) => {
		const index = statuses.findIndex((s) => s.id === status.id);
		return index < statuses.length - 1;
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const response = await fetch("/api/master/case-status/reorder", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ statuses }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Gagal menyimpan perubahan");
			}

			toast.success("Urutan berhasil disimpan");
			setHasChanges(false);
			refetchStatuses();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan perubahan");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const columns = createCaseStatusColumns({
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
						placeholder="Cari status pengadaan..."
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
						Tambah Status
					</Button>
				</div>
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
