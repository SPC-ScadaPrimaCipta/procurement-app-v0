"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProcurementMethodTable } from "@/components/procurement-method/procurement-method-table";
import { MasterDataTableSkeleton } from "@/components/skeletons/master-data-table-skeleton";

export default function MetodePengadaanPage() {
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	if (isInitialLoading) {
		return <MasterDataTableSkeleton />;
	}

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Metode Pengadaan</h1>
				<p className="text-muted-foreground">
					Kelola metode pengadaan untuk proses procurement
				</p>
			</div>

			{/* Content */}
			<Card>
				<CardContent className="p-6 space-y-4">
					<ProcurementMethodTable />
				</CardContent>
			</Card>
		</div>
	);
}
