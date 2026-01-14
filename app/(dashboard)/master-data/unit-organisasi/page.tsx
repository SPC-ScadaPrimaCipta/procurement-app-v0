"use client";

import { Card, CardContent } from "@/components/ui/card";
import { OrgUnitTable } from "@/components/admin/org-unit-table";

export default function UnitOrganisasiPage() {
	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Unit Organisasi</h1>
				<p className="text-muted-foreground">
					Kelola struktur unit organisasi dengan hierarki parent-child
				</p>
			</div>

			{/* Content */}
			<Card>
				<CardContent className="p-6 space-y-4">
					<OrgUnitTable />
				</CardContent>
			</Card>
		</div>
	);
}
