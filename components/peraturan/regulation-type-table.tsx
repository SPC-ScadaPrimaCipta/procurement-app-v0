"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	createRegulationTypeColumns,
	RegulationType,
} from "./regulation-type-columns";
import { RegulationTypeFormDialog } from "./regulation-type-form-dialog";
import { RegulationTypeDeleteDialog } from "./regulation-type-delete-dialog";

export function RegulationTypeTable() {
	const [regulationTypes, setRegulationTypes] = useState<RegulationType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedRegulationType, setSelectedRegulationType] = useState<RegulationType | null>(null);
	const [editingRegulationType, setEditingRegulationType] = useState<RegulationType | null>(null);

	useEffect(() => {
		const fetchRegulationTypes = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/regulation-types");
				if (!response.ok) throw new Error("Failed to fetch regulation types");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: RegulationType) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setRegulationTypes(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data jenis regulasi");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchRegulationTypes();
	}, [refreshTrigger, searchQuery]);

	const refetchRegulationTypes = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingRegulationType(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (regulationType: RegulationType) => {
		setEditingRegulationType(regulationType);
		setFormDialogOpen(true);
	};

	const handleDelete = (regulationType: RegulationType) => {
		setSelectedRegulationType(regulationType);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchRegulationTypes();
		setHasChanges(false);
		toast.success(
			editingRegulationType
				? "Jenis regulasi berhasil diupdate"
				: "Jenis regulasi berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchRegulationTypes();
		toast.success("Jenis regulasi berhasil dihapus");
	};

	const handleMoveUp = (type: RegulationType) => {
		const currentIndex = regulationTypes.findIndex((t) => t.id === type.id);
		if (currentIndex <= 0) return;

		const newTypes = [...regulationTypes];
		[newTypes[currentIndex - 1], newTypes[currentIndex]] = [
			newTypes[currentIndex],
			newTypes[currentIndex - 1],
		];

		newTypes.forEach((t, idx) => {
			t.sort_order = idx + 1;
		});

		setRegulationTypes(newTypes);
		setHasChanges(true);
	};

	const handleMoveDown = (type: RegulationType) => {
		const currentIndex = regulationTypes.findIndex((t) => t.id === type.id);
		if (currentIndex >= regulationTypes.length - 1) return;

		const newTypes = [...regulationTypes];
		[newTypes[currentIndex], newTypes[currentIndex + 1]] = [
			newTypes[currentIndex + 1],
			newTypes[currentIndex],
		];

		newTypes.forEach((t, idx) => {
			t.sort_order = idx + 1;
		});

		setRegulationTypes(newTypes);
		setHasChanges(true);
	};

	const canMoveUp = (type: RegulationType) => {
		return regulationTypes.findIndex((t) => t.id === type.id) > 0;
	};

	const canMoveDown = (type: RegulationType) => {
		const idx = regulationTypes.findIndex((t) => t.id === type.id);
		return idx >= 0 && idx < regulationTypes.length - 1;
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const updates = regulationTypes.map((type) => ({
				id: type.id,
				sort_order: type.sort_order,
			}));

			const response = await fetch("/api/master/regulation-types/reorder", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ types: updates }),
			});

			if (!response.ok) {
				throw new Error("Failed to update sort order");
			}

			toast.success("Urutan berhasil disimpan");
			setHasChanges(false);
			refetchRegulationTypes();
		} catch (error) {
			toast.error("Gagal menyimpan urutan");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const columns = createRegulationTypeColumns({
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
			<div className="flex items-center justify-between">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Cari jenis regulasi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<div className="flex gap-2">
					{hasChanges && (
						<Button
							onClick={handleSaveChanges}
							disabled={isSaving}
							variant="default"
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
					<Button onClick={handleAddNew}>
						<Plus className="h-4 w-4 mr-2" />
						Tambah Jenis Regulasi
					</Button>
				</div>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={regulationTypes} />

			{/* Dialogs */}
			<RegulationTypeFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				regulationType={editingRegulationType}
				onSuccess={handleFormSuccess}
			/>

			<RegulationTypeDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				regulationType={selectedRegulationType}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
