"use client";

import { DataTable } from "@/components/datatable/data-table";
import { RequestItem, columns } from "./columns";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

const mockRequests: RequestItem[] = [
	{
		id: "1",
		title: "Vacation Request - Dec 2024",
		status: "PENDING",
		currentStep: "Manager Approval",
		createdAt: "2024-12-01T09:00:00Z",
		updatedAt: "2024-12-02T10:00:00Z",
	},
	{
		id: "2",
		title: "New Laptop Request",
		status: "APPROVED",
		currentStep: "Completed",
		createdAt: "2023-11-15T14:30:00Z",
		updatedAt: "2023-11-20T11:00:00Z",
	},
	{
		id: "3",
		title: "Project Budget Approval",
		status: "REJECTED",
		currentStep: "Finance Review",
		createdAt: "2023-10-05T08:45:00Z",
		updatedAt: "2023-10-06T16:20:00Z",
	},
	{
		id: "4",
		title: "Conference Travel Request",
		status: "PENDING",
		currentStep: "Director Approval",
		createdAt: "2024-01-08T11:00:00Z",
		updatedAt: "2024-01-08T11:00:00Z",
	},
];

export default function RequestsPage() {
	return (
		<div className="space-y-8">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-semibold">My Requests</h1>
					<p className="text-muted-foreground">
						Track the status of your submitted requests.
					</p>
				</div>
				<Button asChild>
					<Link href="/workflow/new">
						<Plus className="mr-2 h-4 w-4" />
						New Request
					</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Requests</CardTitle>
					<CardDescription>
						A list of all your workflow requests.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable
						columns={columns}
						data={mockRequests}
						filterKey="title"
					/>
				</CardContent>
			</Card>
		</div>
	);
}
