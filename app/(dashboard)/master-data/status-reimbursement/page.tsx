"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ReimbursementStatusTable } from "@/components/reimbursement-status/reimbursement-status-table";

export default function StatusReimbursementPage() {
	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Status Reimbursement</h1>
				<p className="text-muted-foreground">
					Kelola status untuk proses reimbursement
				</p>
			</div>

			{/* Content */}
			<Card>
				<CardContent className="p-6 space-y-4">
					<ReimbursementStatusTable />
				</CardContent>
			</Card>
		</div>
	);
}
