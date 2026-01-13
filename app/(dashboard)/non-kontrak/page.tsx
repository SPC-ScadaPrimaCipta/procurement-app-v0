"use client";

import { useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import {
	createReimbursementColumns,
	type Reimbursement,
} from "@/components/reimbursement/reimbursement-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Search } from "lucide-react";
import { ReimbursementFormDialog } from "@/components/reimbursement/reimbursement-form-dialog";
import { ReimbursementDetailDialog } from "@/components/reimbursement/reimbursement-detail-dialog";
import { ReimbursementDeleteDialog } from "@/components/reimbursement/reimbursement-delete-dialog";

export default function NonKontrakPage() {
	const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState("");
	const [statusFilter, setStatusFilter] = useState("");

	// Dialog states
	const [showFormDialog, setShowFormDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedReimbursement, setSelectedReimbursement] =
		useState<Reimbursement | null>(null);
	const [editMode, setEditMode] = useState(false);

	// Fetch reimbursements
	const fetchReimbursements = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams();
			if (search) params.append("search", search);
			if (statusFilter) params.append("status_id", statusFilter);

			const response = await fetch(`/api/reimbursement?${params.toString()}`);
			if (!response.ok) throw new Error("Failed to fetch");

			const data = await response.json();
			setReimbursements(data.data);
		} catch (error) {
			toast.error("Gagal memuat data non kontrak");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	// Load data on mount and when filters change
	useState(() => {
		fetchReimbursements();
	});

	// Handle row click
	const handleRowClick = (reimbursement: Reimbursement) => {
		setSelectedReimbursement(reimbursement);
		setShowDetailDialog(true);
	};

	// Handle add new
	const handleAdd = () => {
		setEditMode(false);
		setSelectedReimbursement(null);
		setShowFormDialog(true);
	};

	// Handle edit
	const handleEdit = (reimbursement: Reimbursement) => {
		setEditMode(true);
		setSelectedReimbursement(reimbursement);
		setShowFormDialog(true);
	};

	// Handle delete
	const handleDelete = (reimbursement: Reimbursement) => {
		setSelectedReimbursement(reimbursement);
		setShowDeleteDialog(true);
	};

	// Handle form success
	const handleFormSuccess = () => {
		setShowFormDialog(false);
		fetchReimbursements();
		toast.success(
			editMode
				? "Data non kontrak berhasil diupdate"
				: "Data non kontrak berhasil ditambahkan"
		);
	};

	// Handle delete success
	const handleDeleteSuccess = () => {
		setShowDeleteDialog(false);
		setShowDetailDialog(false);
		fetchReimbursements();
		toast.success("Data non kontrak berhasil dihapus");
	};

	return (
		<div className="flex h-screen overflow-hidden">
			{/* Sidebar Filter */}
			<aside className="w-64 border-r bg-background p-4 overflow-y-auto">
				<h2 className="font-semibold mb-4">Data Non Kontrak</h2>

				<div className="space-y-4">
					<div>
						<label className="text-sm font-medium mb-2 block">
							Filter Status
						</label>
						<select
							className="w-full border rounded-md p-2 text-sm"
							value={statusFilter}
							onChange={(e) => {
								setStatusFilter(e.target.value);
								fetchReimbursements();
							}}
						>
							<option value="">Semua Status</option>
							{/* Status options will be populated dynamically */}
						</select>
					</div>

					<Button
						variant="outline"
						className="w-full"
						onClick={() => {
							setSearch("");
							setStatusFilter("");
							fetchReimbursements();
						}}
					>
						Reset Filter
					</Button>
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden flex flex-col">
				<div className="p-6 border-b">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h1 className="text-2xl font-bold">Non Kontrak</h1>
							<p className="text-sm text-muted-foreground">
								Kelola data reimbursement non kontrak
							</p>
						</div>
						<Button onClick={handleAdd}>
							<Plus className="mr-2 h-4 w-4" />
							Tambah Data
						</Button>
					</div>

					<div className="flex items-center gap-2">
						<div className="relative flex-1 max-w-sm">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Cari data non kontrak..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										fetchReimbursements();
									}
								}}
								className="pl-9"
							/>
						</div>
						<Button onClick={fetchReimbursements} variant="secondary">
							Cari
						</Button>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-6">
					<DataTable
						columns={createReimbursementColumns(handleRowClick)}
						data={reimbursements}
					/>
				</div>
			</main>

			{/* Dialogs */}
			<ReimbursementFormDialog
				open={showFormDialog}
				onOpenChange={setShowFormDialog}
				reimbursement={selectedReimbursement}
				editMode={editMode}
				onSuccess={handleFormSuccess}
			/>

			<ReimbursementDetailDialog
				open={showDetailDialog}
				onOpenChange={setShowDetailDialog}
				reimbursement={selectedReimbursement}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onRefresh={fetchReimbursements}
			/>

			<ReimbursementDeleteDialog
				open={showDeleteDialog}
				onOpenChange={setShowDeleteDialog}
				reimbursement={selectedReimbursement}
				onSuccess={handleDeleteSuccess}
			/>
		</div>
	);
}
