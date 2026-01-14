"use client";

import { Card, CardContent } from "@/components/ui/card";
import { SupplierTypeTable } from "@/components/vendor/supplier-type-table";

export default function JenisVendorPage() {
	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Jenis Vendor</h1>
				<p className="text-muted-foreground">
					Kelola jenis/tipe vendor untuk klasifikasi supplier
				</p>
			</div>

			{/* Content */}
			<Card>
				<CardContent className="p-6 space-y-4">
					<SupplierTypeTable />
				</CardContent>
			</Card>
		</div>
	);
}
