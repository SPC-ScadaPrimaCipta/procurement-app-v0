"use client";

import { useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Plus, FileText, Folder } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import {
	createPeraturanColumns,
	Peraturan,
} from "@/components/peraturan/peraturan-columns";
import { PeraturanFormDialog } from "@/components/peraturan/peraturan-form-dialog";
import { PeraturanDetailDialog } from "@/components/peraturan/peraturan-detail-dialog";
import { PeraturanDeleteDialog } from "@/components/peraturan/peraturan-delete-dialog";
import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";

export default function PeraturanPage() {
	const [peraturans, setPeraturans] = useState<Peraturan[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	// Dialog states
	const [formDialogOpen, setFormDialogOpen] = useState(false);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedPeraturan, setSelectedPeraturan] = useState<Peraturan | null>(
		null
	);
	const [editingPeraturan, setEditingPeraturan] = useState<Peraturan | null>(
		null
	);

	useEffect(() => {
		fetchPeraturans();
	}, []);

	const fetchPeraturans = async () => {
		setIsLoading(true);
		try {
			const response = await fetch("/api/peraturan?limit=1000");
			if (!response.ok) throw new Error("Failed to fetch peraturans");

			const data = await response.json();
			setPeraturans(data.data);
		} catch (error) {
			toast.error("Failed to load peraturans");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleViewDetail = (peraturan: Peraturan) => {
		setSelectedPeraturan(peraturan);
		setDetailDialogOpen(true);
	};

	const handleAddNew = () => {
		setEditingPeraturan(null);
		setFormDialogOpen(true);
	};

	const handleEdit = (peraturan: Peraturan) => {
		setEditingPeraturan(peraturan);
		setFormDialogOpen(true);
	};

	const handleDelete = (peraturan: Peraturan) => {
		setSelectedPeraturan(peraturan);
		setDeleteDialogOpen(true);
	};

	const columns = createPeraturanColumns({ onViewDetail: handleViewDetail });

	// Calculate Stats - group by type
	const stats = {
		total: peraturans.length,
		types: [...new Set(peraturans.map((p) => p.type.name))].length,
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
						Peraturan
					</h1>
					<p className="text-muted-foreground">
						Kelola dokumen peraturan dan regulasi
					</p>
				</div>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Peraturan
				</Button>
			</div>

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-2">
				<StatsCard
					title="Total Dokumen"
					value={stats.total}
					icon={FileText}
					iconClassName="text-primary"
				/>
				<StatsCard
					title="Tipe Dokumen"
					value={stats.types}
					icon={Folder}
					iconClassName="text-blue-500"
				/>
			</div>

			{/* DataTable wrapped in Card */}
			<Card>
				<CardContent className="p-0">
					<div className="px-4">
						<DataTable
							columns={columns}
							data={peraturans}
							filterKey="doc_number"
							statusFilterKey="type.name"
							statusColumnId="type"
							statusFilterLabel="Tipe Dokumen"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Form Dialog */}
			<PeraturanFormDialog
				open={formDialogOpen}
				onOpenChange={setFormDialogOpen}
				peraturan={editingPeraturan}
				onSuccess={() => {
					fetchPeraturans();
					setFormDialogOpen(false);
				}}
			/>

			{/* Detail Dialog */}
			<PeraturanDetailDialog
				peraturanId={selectedPeraturan?.id || null}
				open={detailDialogOpen}
				onOpenChange={setDetailDialogOpen}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>

			{/* Delete Dialog */}
			<PeraturanDeleteDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				peraturan={selectedPeraturan}
				onSuccess={() => {
					fetchPeraturans();
					setDeleteDialogOpen(false);
					setDetailDialogOpen(false);
				}}
			/>
		</div>
	);
}
