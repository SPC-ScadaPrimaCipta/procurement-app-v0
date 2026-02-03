"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { getVendorColumns, Vendor } from "@/components/vendor/vendor-columns";
import { VendorDeleteDialog } from "@/components/vendor/vendor-delete-dialog";
import { VendorDetailDialog } from "@/components/vendor/vendor-detail-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Plus, Users, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";

export default function VendorPage() {
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [detailVendorId, setDetailVendorId] = useState<string | null>(null);
	const [detailDialogOpen, setDetailDialogOpen] = useState(false);

	const fetchVendors = async () => {
		try {
			const response = await fetch("/api/vendors");
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
	}, []);

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

	// Calculate Stats
	const stats = {
		total: vendors.length,
		active: vendors.filter((vendor) => vendor.is_active).length,
		inactive: vendors.filter((vendor) => !vendor.is_active).length,
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
						Vendor
					</h1>
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

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatsCard
					title="Total Vendor"
					value={stats.total}
					icon={Users}
					iconClassName="text-primary"
				/>
				<StatsCard
					title="Active"
					value={stats.active}
					icon={UserCheck}
					iconClassName="text-green-500"
				/>
				<StatsCard
					title="Inactive"
					value={stats.inactive}
					icon={UserX}
					iconClassName="text-orange-500"
				/>
			</div>

			{/* DataTable wrapped in Card */}
			<Card>
				<CardContent className="p-0">
					<div className="px-4">
						<DataTable
							columns={columns}
							data={vendors}
							filterKey="vendor_name"
							statusFilterKey="supplier_type.name"
							statusColumnId="supplier_type"
							statusFilterLabel="Tipe Supplier"
						/>
					</div>
				</CardContent>
			</Card>

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
