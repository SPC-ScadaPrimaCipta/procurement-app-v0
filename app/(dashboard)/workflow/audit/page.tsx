"use client";

import { DataTable } from "@/components/datatable/data-table";
import { AuditLogItem, columns } from "./columns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const mockAuditLogs: AuditLogItem[] = [
	{
		id: "1",
		workflowTitle: "Leave Request - John Doe",
		action: "APPROVED",
		performedBy: "Manager Mike",
		details: "Approved leave request for dates 12/20 - 12/24",
		timestamp: "2024-01-07T10:15:00Z",
		ipAddress: "192.168.1.50",
	},
	{
		id: "2",
		workflowTitle: "New Laptop Request",
		action: "CREATED",
		performedBy: "Jane Smith",
		details: "Submitted new request for MacBook Pro M3",
		timestamp: "2024-01-07T09:45:00Z",
		ipAddress: "10.0.0.12",
	},
	{
		id: "3",
		workflowTitle: "Project Budget Approval",
		action: "REJECTED",
		performedBy: "Finance Director",
		details: "Rejected due to budget constraints. Comment: 'Too high'.",
		timestamp: "2024-01-06T16:30:00Z",
		ipAddress: "172.16.0.5",
	},
	{
		id: "4",
		workflowTitle: "System Settings",
		action: "UPDATED",
		performedBy: "Super Admin",
		details: "Changed global workflow timeout to 48 hours",
		timestamp: "2024-01-05T11:00:00Z",
		ipAddress: "192.168.1.200",
	},
	{
		id: "5",
		workflowTitle: "User Role",
		action: "UPDATED",
		performedBy: "Admin System",
		details: "Assigned 'manager' role to user 'mike.manager'",
		timestamp: "2024-01-05T10:00:00Z",
		ipAddress: "System",
	},
];

export default function AuditPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold">Audit Logs</h1>
				<p className="text-muted-foreground">
					Track system changes and user actions for compliance and
					security.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>System Activity</CardTitle>
					<CardDescription>
						A chronological record of significant events.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={mockAuditLogs}
						filterKey="workflowTitle"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
