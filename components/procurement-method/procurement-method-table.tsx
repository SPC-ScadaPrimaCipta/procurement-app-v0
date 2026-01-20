"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
	createProcurementMethodColumns,
	ProcurementMethod,
} from "./procurement-method-columns";
import { ProcurementMethodFormDialog } from "./procurement-method-form-dialog";
import { ProcurementMethodDeleteDialog } from "./procurement-method-delete-dialog";

export function ProcurementMethodTable() {
	const [procurementMethods, setProcurementMethods] = useState<ProcurementMethod[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);
	const [hasChanges, setHasChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedProcurementMethod, setSelectedProcurementMethod] = useState<ProcurementMethod | null>(null);
	const [editingProcurementMethod, setEditingProcurementMethod] = useState<ProcurementMethod | null>(null);

	useEffect(() => {
		const fetchProcurementMethods = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/procurement-method");
				if (!response.ok) throw new Error("Failed to fetch procurement methods");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: ProcurementMethod) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setProcurementMethods(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data metode pengadaan");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchProcurementMethods();
	}, [refreshTrigger, searchQuery]);

	const refetchProcurementMethods = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingProcurementMethod(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (procurementMethod: ProcurementMethod) => {
		setEditingProcurementMethod(procurementMethod);
		setFormDialogOpen(true);
	};

	const handleDelete = (procurementMethod: ProcurementMethod) => {
		setSelectedProcurementMethod(procurementMethod);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchProcurementMethods();
		setHasChanges(false);
		toast.success(
			editingProcurementMethod
				? "metode pengadaan berhasil diupdate"
				: "metode pengadaan berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchProcurementMethods();
		toast.success("metode pengadaan berhasil dihapus");
	};

	const handleMoveUp = (method: ProcurementMethod) => {
		const currentIndex = procurementMethods.findIndex((m) => m.id === method.id);
		if (currentIndex <= 0) return;

		const newMethods = [...procurementMethods];
		[newMethods[currentIndex - 1], newMethods[currentIndex]] = [
			newMethods[currentIndex],
			newMethods[currentIndex - 1],
		];

		newMethods.forEach((m, idx) => {
			m.sort_order = idx + 1;
		});

		setProcurementMethods(newMethods);
		setHasChanges(true);
	};

	const handleMoveDown = (method: ProcurementMethod) => {
		const currentIndex = procurementMethods.findIndex((m) => m.id === method.id);
		if (currentIndex >= procurementMethods.length - 1) return;

		const newMethods = [...procurementMethods];
		[newMethods[currentIndex], newMethods[currentIndex + 1]] = [
			newMethods[currentIndex + 1],
			newMethods[currentIndex],
		];

		newMethods.forEach((m, idx) => {
			m.sort_order = idx + 1;
		});

		setProcurementMethods(newMethods);
		setHasChanges(true);
	};

	const canMoveUp = (method: ProcurementMethod) => {
		return procurementMethods.findIndex((m) => m.id === method.id) > 0;
	};

	const canMoveDown = (method: ProcurementMethod) => {
		const idx = procurementMethods.findIndex((m) => m.id === method.id);
		return idx >= 0 && idx < procurementMethods.length - 1;
	};

	const handleSaveChanges = async () => {
		setIsSaving(true);
		try {
			const updates = procurementMethods.map((method) => ({
				id: method.id,
				sort_order: method.sort_order,
			}));

			const response = await fetch("/api/master/procurement-method/reorder", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ methods: updates }),
			});

			if (!response.ok) {
				throw new Error("Failed to update sort order");
			}

			toast.success("Urutan berhasil disimpan");
			setHasChanges(false);
			refetchProcurementMethods();
		} catch (error) {
			toast.error("Gagal menyimpan urutan");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	const columns = createProcurementMethodColumns({
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
						placeholder="Cari metode pengadaan..."
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
						Tambah metode Pengadaan
					</Button>
				</div>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={procurementMethods} />

			{/* Dialogs */}
			<ProcurementMethodFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				procurementMethod={editingProcurementMethod}
				onSuccess={handleFormSuccess}
			/>

			<ProcurementMethodDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				procurementMethod={selectedProcurementMethod}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
