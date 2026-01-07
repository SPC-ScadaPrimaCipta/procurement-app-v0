"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";

export type InboxItem = {
	id: string;
	title: string;
	status: "PENDING" | "APPROVED" | "REJECTED";
	requestedBy: string;
	createdAt: string;
	priority: "LOW" | "MEDIUM" | "HIGH";
};

export const columns: ColumnDef<InboxItem>[] = [
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Title" />
		),
	},
	{
		accessorKey: "requestedBy",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Requested By" />
		),
	},
	{
		accessorKey: "priority",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Priority" />
		),
		cell: ({ row }) => {
			const priority = row.getValue("priority") as string;
			return (
				<Badge
					variant={
						priority === "HIGH"
							? "destructive"
							: priority === "MEDIUM"
							? "secondary"
							: "outline"
					}
				>
					{priority}
				</Badge>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge
					variant={
						status === "APPROVED"
							? "secondary"
							: status === "REJECTED"
							? "destructive"
							: "outline"
					}
					className={
						status === "APPROVED"
							? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-100"
							: ""
					}
				>
					{status}
				</Badge>
			);
		},
	},
	{
		accessorKey: "createdAt",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Date" />
		),
		cell: ({ row }) => {
			return new Date(row.getValue("createdAt")).toLocaleDateString();
		},
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const payment = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Actions</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(payment.id)
							}
						>
							Copy ID
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View details</DropdownMenuItem>
						<DropdownMenuItem>Approve</DropdownMenuItem>
						<DropdownMenuItem className="text-red-600">
							Reject
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
