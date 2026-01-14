"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CaseStatusTable } from "@/components/case-status/case-status-table";

export default function StatusPengadaanPage() {
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
