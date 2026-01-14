"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createSupplierTypeColumns,
	SupplierType,
} from "./supplier-type-columns";
import { SupplierTypeFormDialog } from "./supplier-type-form-dialog";
import { SupplierTypeDeleteDialog } from "./supplier-type-delete-dialog";

export function SupplierTypeTable() {
	const [supplierTypes, setSupplierTypes] = useState<SupplierType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedSupplierType, setSelectedSupplierType] = useState<SupplierType | null>(null);
	const [editingSupplierType, setEditingSupplierType] = useState<SupplierType | null>(null);

	useEffect(() => {
		const fetchSupplierTypes = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/supplier-types");
				if (!response.ok) throw new Error("Failed to fetch supplier types");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: SupplierType) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setSupplierTypes(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data jenis vendor");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchSupplierTypes();
	}, [refreshTrigger, searchQuery]);

	const refetchSupplierTypes = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingSupplierType(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (supplierType: SupplierType) => {
		setEditingSupplierType(supplierType);
		setFormDialogOpen(true);
	};

	const handleDelete = (supplierType: SupplierType) => {
		setSelectedSupplierType(supplierType);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchSupplierTypes();
		toast.success(
			editingSupplierType
				? "Jenis vendor berhasil diupdate"
				: "Jenis vendor berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchSupplierTypes();
		toast.success("Jenis vendor berhasil dihapus");
	};

	const columns = createSupplierTypeColumns({
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
						placeholder="Cari jenis vendor..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Jenis Vendor
				</Button>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={supplierTypes} />

			{/* Dialogs */}
			<SupplierTypeFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				supplierType={editingSupplierType}
				onSuccess={handleFormSuccess}
			/>

			<SupplierTypeDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				supplierType={selectedSupplierType}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
