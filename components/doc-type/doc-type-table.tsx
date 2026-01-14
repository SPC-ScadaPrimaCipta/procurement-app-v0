"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createDocTypeColumns,
	DocType,
} from "./doc-type-columns";
import { DocTypeFormDialog } from "./doc-type-form-dialog";
import { DocTypeDeleteDialog } from "./doc-type-delete-dialog";

export function DocTypeTable() {
	const [docTypes, setDocTypes] = useState<DocType[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedDocType, setSelectedDocType] = useState<DocType | null>(null);
	const [editingDocType, setEditingDocType] = useState<DocType | null>(null);

	useEffect(() => {
		const fetchDocTypes = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/doc-type");
				if (!response.ok) throw new Error("Failed to fetch doc types");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: DocType) =>
						item.name.toLowerCase().includes(searchQuery.toLowerCase())
					);
				}

				setDocTypes(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data jenis dokumen");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchDocTypes();
	}, [refreshTrigger, searchQuery]);

	const refetchDocTypes = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingDocType(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (docType: DocType) => {
		setEditingDocType(docType);
		setFormDialogOpen(true);
	};

	const handleDelete = (docType: DocType) => {
		setSelectedDocType(docType);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchDocTypes();
		toast.success(
			editingDocType
				? "Jenis dokumen berhasil diupdate"
				: "Jenis dokumen berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchDocTypes();
		toast.success("Jenis dokumen berhasil dihapus");
	};

	const columns = createDocTypeColumns({
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
						placeholder="Cari jenis dokumen..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Jenis Dokumen
				</Button>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={docTypes} />

			{/* Dialogs */}
			<DocTypeFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				docType={editingDocType}
				onSuccess={handleFormSuccess}
			/>

			<DocTypeDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				docType={selectedDocType}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
