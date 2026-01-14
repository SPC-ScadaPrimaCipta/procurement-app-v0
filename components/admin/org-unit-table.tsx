"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
	createOrgUnitColumns,
	OrgUnit,
} from "./org-unit-columns";
import { OrgUnitFormDialog } from "./org-unit-form-dialog";
import { OrgUnitDeleteDialog } from "./org-unit-delete-dialog";

export function OrgUnitTable() {
	const [orgUnits, setOrgUnits] = useState<OrgUnit[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedOrgUnit, setSelectedOrgUnit] = useState<OrgUnit | null>(null);
	const [editingOrgUnit, setEditingOrgUnit] = useState<OrgUnit | null>(null);

	useEffect(() => {
		const fetchOrgUnits = async () => {
			setIsLoading(true);
			try {
				const response = await fetch("/api/master/org-unit");
				if (!response.ok) throw new Error("Failed to fetch org units");

				const data = await response.json();

				// Filter by search query if exists
				let filteredData = data;
				if (searchQuery) {
					filteredData = data.filter((item: OrgUnit) =>
						item.unit_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						item.unit_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
						(item.unit_code && item.unit_code.toLowerCase().includes(searchQuery.toLowerCase()))
					);
				}

				setOrgUnits(filteredData);
			} catch (error) {
				toast.error("Gagal memuat data unit organisasi");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchOrgUnits();
	}, [refreshTrigger, searchQuery]);

	const refetchOrgUnits = () => {
		setRefreshTrigger((prev) => prev + 1);
	};

	const handleAddNew = () => {
		setEditingOrgUnit(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (orgUnit: OrgUnit) => {
		setEditingOrgUnit(orgUnit);
		setFormDialogOpen(true);
	};

	const handleDelete = (orgUnit: OrgUnit) => {
		setSelectedOrgUnit(orgUnit);
		setDeleteDialogOpen(true);
	};

	const handleFormSuccess = () => {
		setFormDialogOpen(false);
		refetchOrgUnits();
		toast.success(
			editingOrgUnit
				? "Unit organisasi berhasil diupdate"
				: "Unit organisasi berhasil ditambahkan"
		);
	};

	const handleDeleteSuccess = () => {
		setDeleteDialogOpen(false);
		refetchOrgUnits();
		toast.success("Unit organisasi berhasil dihapus");
	};

	const columns = createOrgUnitColumns({
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
						placeholder="Cari unit organisasi..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Unit Organisasi
				</Button>
			</div>

			{/* Table */}
			<DataTable columns={columns} data={orgUnits} />

			{/* Dialogs */}
			<OrgUnitFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				orgUnit={editingOrgUnit}
				orgUnits={orgUnits}
				onSuccess={handleFormSuccess}
			/>

			<OrgUnitDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				orgUnit={selectedOrgUnit}
				onSuccess={handleDeleteSuccess}
			/>
		</>
	);
}
