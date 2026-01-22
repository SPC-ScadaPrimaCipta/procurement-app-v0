"use client";

import { useState } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import {
	createPeraturanColumns,
	Peraturan,
} from "@/components/peraturan/peraturan-columns";
import { PeraturanFormDialog } from "@/components/peraturan/peraturan-form-dialog";
import { PeraturanDetailDialog } from "@/components/peraturan/peraturan-detail-dialog";
import { PeraturanDeleteDialog } from "@/components/peraturan/peraturan-delete-dialog";
import { Card } from "@/components/ui/card";
import { VendorSkeleton } from "@/components/skeletons/vendor-skeleton";

export default function PeraturanPage() {
	const [peraturans, setPeraturans] = useState<Peraturan[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

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
	}, [searchQuery]);

	const fetchPeraturans = async () => {
		setIsLoading(true);
		try {
			const queryParams = new URLSearchParams({
				limit: "1000",
			});

			if (searchQuery) {
				queryParams.append("search", searchQuery);
			}

			const response = await fetch(`/api/peraturan?${queryParams}`);
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

	if (isLoading) {
		return <VendorSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<h1 className="text-3xl font-bold">Peraturan</h1>
				<Button onClick={handleAddNew}>
					<Plus className="h-4 w-4 mr-2" />
					Tambah Peraturan
				</Button>
			</div>

			{/* Search */}
			<Card className="p-6">
				<div className="flex items-center gap-4">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Cari nomor dokumen atau judul..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>
				</div>

				{/* Data Table */}
				<div className="mt-6">
					<DataTable columns={columns} data={peraturans} />
				</div>
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
