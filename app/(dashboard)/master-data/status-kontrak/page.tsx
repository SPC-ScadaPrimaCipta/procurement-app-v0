"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ContractStatusTable } from "@/components/contract-status/contract-status-table";
import { MasterDataTableSkeleton } from "@/components/skeletons/master-data-table-skeleton";

export default function StatusKontrakPage() {
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
				<h1 className="text-2xl font-bold tracking-tight">Status Kontrak</h1>
				<p className="text-muted-foreground">
					Kelola status untuk kontrak pengadaan
				</p>
			</div>

			{/* Content */}
			<Card>
				<CardContent className="p-6 space-y-4">
					<ContractStatusTable />
				</CardContent>
			</Card>
		</div>
	);
}
