"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { getVendorColumns, Vendor } from "@/components/vendor/vendor-columns";
import { VendorDeleteDialog } from "@/components/vendor/vendor-delete-dialog";
import { VendorDetailDialog } from "@/components/vendor/vendor-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function VendorPage() {
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [detailVendorId, setDetailVendorId] = useState<string | null>(null);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);

	const fetchVendors = async () => {
		setIsLoading(true);
		try {
			const params = new URLSearchParams();
			if (searchQuery) {
				params.append("search", searchQuery);
			}

			const response = await fetch(`/api/vendors?${params.toString()}`);
			if (!response.ok) {
				throw new Error("Failed to fetch vendors");
			}

			const result = await response.json();
			setVendors(result.data || []);
		} catch (error) {
			toast.error("Failed to load vendors");
			console.error("Error fetching vendors:", error);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchVendors();
	}, [searchQuery]);

	const handleDelete = (vendor: Vendor) => {
		setDeleteVendor(vendor);
		setDeleteDialogOpen(true);
	};

	const handleViewDetail = (vendorId: string) => {
		setDetailVendorId(vendorId);
		setDetailDialogOpen(true);
	};

	const handleDeleteSuccess = () => {
		fetchVendors();
	};

	const columns = getVendorColumns({ 
		onDelete: handleDelete,
		onViewDetail: handleViewDetail,
	});

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Vendor</h1>
					<p className="text-muted-foreground">
						Kelola data vendor dan supplier
					</p>
				</div>
				<Button asChild>
					<Link href="/vendor/new">
						<Plus className="mr-2 h-4 w-4" />
						Tambah Vendor
					</Link>
				</Button>
			</div>

			{/* Search and Filters */}
			<div className="flex items-center gap-4">
				<div className="relative flex-1 max-w-sm">
					<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Cari nama vendor atau NPWP..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="pl-9"
					/>
				</div>
			</div>

			{/* Data Table */}
			<div className="rounded-lg border bg-card p-6">
				<DataTable
					columns={columns}
					data={vendors}
					filterKey="vendor_name"
				/>
			</div>

			{/* Delete Dialog */}
			<VendorDeleteDialog
				vendor={deleteVendor}
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				onSuccess={handleDeleteSuccess}
			/>

			{/* Detail Dialog */}
			<VendorDetailDialog
				vendorId={detailVendorId}
				open={detailDialogOpen}
				onOpenChange={setDetailDialogOpen}
			/>
		</div>
	);
}
