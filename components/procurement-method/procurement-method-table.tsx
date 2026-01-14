"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
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
				toast.error("Gagal memuat data jenis pengadaan");
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
		toast.success(
			editingProcurementMethod
				? "Jenis pengadaan berhasil diupdate"
				: "Jenis pengadaan berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchProcurementMethods();
		toast.success("Jenis pengadaan berhasil dihapus");
	};

	const columns = createProcurementMethodColumns({
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
						placeholder="Cari jenis pengadaan..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Jenis Pengadaan
				</Button>
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
