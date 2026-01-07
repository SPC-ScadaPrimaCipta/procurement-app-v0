"use client";

import { DataTable } from "@/components/datatable/data-table";
import { InboxItem, columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

const mockPendingData: InboxItem[] = [
	{
		id: "1",
		title: "Leave Request - John Doe",
		requestedBy: "John Doe",
		status: "PENDING",
		createdAt: "2024-01-05T10:00:00Z",
		priority: "MEDIUM",
	},
	{
		id: "2",
		title: "Purchase Order #1234",
		requestedBy: "Jane Smith",
		status: "PENDING",
		createdAt: "2024-01-06T14:30:00Z",
		priority: "HIGH",
	},
	{
		id: "3",
		title: "New User Account",
		requestedBy: "Admin System",
		status: "PENDING",
		createdAt: "2024-01-07T09:00:00Z",
		priority: "LOW",
	},
];

const mockHistoryData: InboxItem[] = [
	{
		id: "4",
		title: "Expense Report Q4",
		requestedBy: "Alice Johnson",
		status: "APPROVED",
		createdAt: "2023-12-28T11:20:00Z",
		priority: "MEDIUM",
	},
	{
		id: "5",
		title: "Software License Renewal",
		requestedBy: "Bob Brown",
		status: "REJECTED",
		createdAt: "2023-12-30T16:45:00Z",
		priority: "HIGH",
	},
];

export default function InboxPage() {
	return (
		<div className="space-y-8">
			<div>
				<h1 className="text-2xl font-semibold">Inbox</h1>
				<p className="text-muted-foreground">
					Manage your pending tasks and view request history.
				</p>
			</div>

			<Tabs defaultValue="pending" className="w-full">
				<TabsList>
					<TabsTrigger value="pending">
						Pending ({mockPendingData.length})
					</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
				</TabsList>
				<TabsContent value="pending" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Pending Requests</CardTitle>
							<CardDescription>
								Requests waiting for your approval.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={columns}
								data={mockPendingData}
								filterKey="title"
							/>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="history" className="mt-4">
					<Card>
						<CardHeader>
							<CardTitle>Request History</CardTitle>
							<CardDescription>
								View past requests and their outcomes.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={columns}
								data={mockHistoryData}
								filterKey="title"
							/>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}
