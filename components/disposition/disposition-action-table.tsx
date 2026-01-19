"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Loader2 } from "lucide-react";
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
	const [isSaving, setIsSaving] = useState(false);
	const [hasChanges, setHasChanges] = useState(false);
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
				
				// Sort by sort_order first
				const sortedData = data.sort((a: DispositionAction, b: DispositionAction) => 
					a.sort_order - b.sort_order
				);

				// Filter by search query if exists
				let filteredData = sortedData;
				if (searchQuery) {
					filteredData = sortedData.filter((item: DispositionAction) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}
				
				setActions(filteredData);
				setHasChanges(false);
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

	const handleMoveUp = (action: DispositionAction) => {
		const currentIndex = actions.findIndex((a) => a.id === action.id);
		if (currentIndex <= 0) return;

		const newActions = [...actions];
		[newActions[currentIndex - 1], newActions[currentIndex]] = [
			newActions[currentIndex],
			newActions[currentIndex - 1],
		];

		// Update sort_order based on new index
		const reordered = newActions.map((a, idx) => ({
			...a,
			sort_order: idx + 1,
		}));

		setActions(reordered);
		setHasChanges(true);
	};

	const handleMoveDown = (action: DispositionAction) => {
		const currentIndex = actions.findIndex((a) => a.id === action.id);
		if (currentIndex >= actions.length - 1) return;

		const newActions = [...actions];
		[newActions[currentIndex + 1], newActions[currentIndex]] = [
			newActions[currentIndex],
			newActions[currentIndex + 1],
		];

		// Update sort_order based on new index
		const reordered = newActions.map((a, idx) => ({
			...a,
			sort_order: idx + 1,
		}));

		setActions(reordered);
		setHasChanges(true);
	};

	const canMoveUp = (action: DispositionAction) => {
		const index = actions.findIndex((a) => a.id === action.id);
		return index > 0;
	};

	const canMoveDown = (action: DispositionAction) => {
		const index = actions.findIndex((a) => a.id === action.id);
		return index < actions.length - 1;
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const response = await fetch("/api/master/disposition-action/reorder", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ actions }),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Gagal menyimpan perubahan");
			}

			toast.success("Urutan berhasil disimpan");
			setHasChanges(false);
			refetchActions();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan perubahan");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const columns = createDispositionActionColumns({
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
						placeholder="Cari instruksi disposisi..."
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
						Tambah Instruksi
					</Button>
				</div>
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
