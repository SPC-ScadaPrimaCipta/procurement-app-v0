"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ContractStatusTable } from "@/components/contract-status/contract-status-table";

export default function StatusKontrakPage() {
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
