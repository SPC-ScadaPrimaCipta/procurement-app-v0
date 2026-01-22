"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CaseStatusTable } from "@/components/case-status/case-status-table";
import { MasterDataTableSkeleton } from "@/components/skeletons/master-data-table-skeleton";

export default function StatusPengadaanPage() {
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
				<h1 className="text-2xl font-bold tracking-tight">Status Pengadaan</h1>
				<p className="text-muted-foreground">
					Kelola status untuk proses pengadaan barang dan jasa
				</p>
			</div>

			{/* Content */}
			<Card>
				<CardContent className="p-6 space-y-4">
					<CaseStatusTable />
				</CardContent>
			</Card>
		</div>
	);
}
