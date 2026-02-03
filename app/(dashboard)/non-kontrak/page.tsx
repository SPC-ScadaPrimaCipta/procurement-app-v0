"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import {
	createReimbursementColumns,
	type Reimbursement,
} from "@/components/reimbursement/reimbursement-columns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { toast } from "sonner";
import { Plus, FileText, Clock, CheckCircle2 } from "lucide-react";
import { ReimbursementFormDialog } from "@/components/reimbursement/reimbursement-form-dialog";
import { ReimbursementDetailDialog } from "@/components/reimbursement/reimbursement-detail-dialog";
import { ReimbursementDeleteDialog } from "@/components/reimbursement/reimbursement-delete-dialog";
import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";

export default function NonKontrakPage() {
	const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Dialog states
	const [showFormDialog, setShowFormDialog] = useState(false);
	const [showDetailDialog, setShowDetailDialog] = useState(false);
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [selectedReimbursement, setSelectedReimbursement] =
		useState<Reimbursement | null>(null);
	const [editMode, setEditMode] = useState(false);

	// Fetch reimbursements
	const fetchReimbursements = async () => {
		try {
			const response = await fetch("/api/reimbursement");
			if (!response.ok) throw new Error("Failed to fetch");

			const data = await response.json();
			setReimbursements(data.data);
		} catch (error) {
			toast.error("Gagal memuat data non kontrak");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	// Load data on mount and when filters change
	useEffect(() => {
		fetchReimbursements();
	}, []);

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

	// Calculate Stats
	const stats = {
		total: reimbursements.length,
		pending: reimbursements.filter((item) =>
			["DRAFT", "PENDING", "WAITING"].some((s) =>
				item.status.name.toUpperCase().includes(s)
			)
		).length,
		completed: reimbursements.filter((item) =>
			["SELESAI", "COMPLETED", "DONE", "APPROVED"].some((s) =>
				item.status.name.toUpperCase().includes(s)
			)
		).length,
	};

	if (isLoading) {
		return <TablePageSkeleton showButton={true} />;
	}

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Non Kontrak
					</h1>
					<p className="text-muted-foreground">
						Kelola data reimbursement non kontrak
					</p>
				</div>
				<Button onClick={handleAdd}>
					<Plus className="mr-2 h-4 w-4" />
					Tambah Data
				</Button>
			</div>

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatsCard
					title="Total Non Kontrak"
					value={stats.total}
					icon={FileText}
					iconClassName="text-primary"
				/>
				<StatsCard
					title="Pending"
					value={stats.pending}
					icon={Clock}
					iconClassName="text-orange-500"
				/>
				<StatsCard
					title="Selesai"
					value={stats.completed}
					icon={CheckCircle2}
					iconClassName="text-green-500"
				/>
			</div>

			{/* DataTable wrapped in Card */}
			<Card>
				<CardContent className="p-0">
					<div className="px-4">
						<DataTable
							columns={createReimbursementColumns()}
							data={reimbursements}
							onRowClick={handleRowClick}
							filterKey="reimbursement_no"
							statusFilterKey="status.name"
							statusColumnId="status"
						/>
					</div>
				</CardContent>
			</Card>

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
