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

export type AuditLogItem = {
	id: string;
	workflowTitle: string;
	action: "CREATED" | "APPROVED" | "REJECTED" | "UPDATED" | "DELETED";
	performedBy: string;
	details: string;
	timestamp: string;
	ipAddress: string;
};

export const columns: ColumnDef<AuditLogItem>[] = [
	{
		accessorKey: "timestamp",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Timestamp" />
		),
		cell: ({ row }) => {
			return new Date(row.getValue("timestamp")).toLocaleString();
		},
	},
	{
		accessorKey: "action",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Action" />
		),
		cell: ({ row }) => {
			const action = row.getValue("action") as string;
			return (
				<Badge
					variant="outline"
					className={
						action === "APPROVED"
							? "text-green-600 border-green-600"
							: action === "REJECTED"
							? "text-red-600 border-red-600"
							: ""
					}
				>
					{action}
				</Badge>
			);
		},
	},
	{
		accessorKey: "workflowTitle",
		header: ({ column }) => (
			<DataTableColumnHeader
				column={column}
				title="Resource / Workflow"
			/>
		),
	},
	{
		accessorKey: "performedBy",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Performed By" />
		),
	},
	{
		accessorKey: "details",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Details" />
		),
		cell: ({ row }) => (
			<div
				className="max-w-[300px] truncate"
				title={row.getValue("details")}
			>
				{row.getValue("details")}
			</div>
		),
	},
	{
		accessorKey: "ipAddress",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="IP Address" />
		),
		cell: ({ row }) => (
			<span className="font-mono text-xs">
				{row.getValue("ipAddress")}
			</span>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => {
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
								navigator.clipboard.writeText(
									JSON.stringify(row.original, null, 2)
								)
							}
						>
							Copy Log JSON
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem>View full details</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
