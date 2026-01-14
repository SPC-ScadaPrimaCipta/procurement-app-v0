"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProcurementMethodTable } from "@/components/procurement-method/procurement-method-table";

export default function JenisPengadaanPage() {
	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Jenis Pengadaan</h1>
				<p className="text-muted-foreground">
					Kelola jenis/metode pengadaan untuk proses procurement
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
