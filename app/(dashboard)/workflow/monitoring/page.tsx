"use client";

import { DataTable } from "@/components/datatable/data-table";
import { MonitorItem, columns } from "./columns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Activity, CheckCircle2, Clock, XCircle } from "lucide-react";

const mockMonitorData: MonitorItem[] = [
	{
		id: "1",
		title: "Vacation Request - Dec 2024",
		status: "PENDING",
		currentStep: "Manager Approval",
		submittedBy: "John Doe",
		createdAt: "2024-12-01T09:00:00Z",
		updatedAt: "2024-12-02T10:00:00Z",
	},
	{
		id: "2",
		title: "New Laptop Request",
		status: "APPROVED",
		currentStep: "Completed",
		submittedBy: "Jane Smith",
		createdAt: "2023-11-15T14:30:00Z",
		updatedAt: "2023-11-20T11:00:00Z",
	},
	{
		id: "3",
		title: "Project Budget Approval",
		status: "REJECTED",
		currentStep: "Finance Review",
		submittedBy: "Mike Jones",
		createdAt: "2023-10-05T08:45:00Z",
		updatedAt: "2023-10-06T16:20:00Z",
	},
	{
		id: "4",
		title: "Conference Travel Request",
		status: "PENDING",
		currentStep: "Director Approval",
		submittedBy: "Alice Williams",
		createdAt: "2024-01-08T11:00:00Z",
		updatedAt: "2024-01-08T11:00:00Z",
	},
	{
		id: "5",
		title: "Server Access Request",
		status: "PENDING",
		currentStep: "IT Security Review",
		submittedBy: "Bob Developer",
		createdAt: "2024-01-09T09:30:00Z",
		updatedAt: "2024-01-09T09:30:00Z",
	},
];

export default function MonitoringPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold">Workflow Monitoring</h1>
				<p className="text-muted-foreground">
					Oversee all workflow instances and track their progress.
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Requests
						</CardTitle>
						<Activity className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{mockMonitorData.length}
						</div>
						<p className="text-xs text-muted-foreground">
							All time
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Pending
						</CardTitle>
						<Clock className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{
								mockMonitorData.filter(
									(i) => i.status === "PENDING"
								).length
							}
						</div>
						<p className="text-xs text-muted-foreground">
							Currently active
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Approved
						</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{
								mockMonitorData.filter(
									(i) => i.status === "APPROVED"
								).length
							}
						</div>
						<p className="text-xs text-muted-foreground">
							Successfully completed
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Rejected
						</CardTitle>
						<XCircle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{
								mockMonitorData.filter(
									(i) => i.status === "REJECTED"
								).length
							}
						</div>
						<p className="text-xs text-muted-foreground">
							Denied requests
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Workflow Instances</CardTitle>
					<CardDescription>
						A comprehensive list of all workflows in the system.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={mockMonitorData}
						filterKey="title"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
