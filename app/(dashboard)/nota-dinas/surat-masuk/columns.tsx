"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Copy } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";

// Type Definition
export type NotaDinas = {
	id: string;
	case_code: string;
	letter_number: string;
	letter_date: string;
	from: string;
	subject: string;
	status: string;
	created_at: string;
};

// Helper for Status Color
const getStatusColor = (status: string) => {
	switch (status) {
		case "DRAFT":
			return "secondary";
		case "SUBMITTED":
			return "default"; // or blue
		case "APPROVED":
			return "default"; // green usually but using default for now
		default:
			return "outline";
	}
};

export const columns: ColumnDef<NotaDinas>[] = [
	{
		accessorKey: "letter_number",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nomor Surat" />
		),
	},
	{
		accessorKey: "letter_date",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tanggal Surat" />
		),
	},
	{
		accessorKey: "from",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dari" />
		),
	},
	{
		accessorKey: "subject",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Perihal" />
		),
		cell: ({ row }) => (
			<div
				className="max-w-[300px] truncate"
				title={row.getValue("subject")}
			>
				{row.getValue("subject")}
			</div>
		),
	},
	{
		accessorKey: "status",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.getValue("status") as string;
			return (
				<Badge variant={getStatusColor(status) as any}>{status}</Badge>
			);
		},
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Created At" />
		),
		cell: ({ row }) => (
			<div className="text-xs text-muted-foreground">
				{new Date(row.getValue("created_at")).toLocaleDateString()}
			</div>
		),
	},
	{
		id: "actions",
		cell: ({ row }) => {
			const item = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Open menu</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>Aksi</DropdownMenuLabel>
						<DropdownMenuItem
							onClick={() =>
								navigator.clipboard.writeText(item.case_code)
							}
						>
							<Copy className="mr-2 h-4 w-4" />
							Copy Case Code
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => console.log("View details", item.id)}
						>
							<Eye className="mr-2 h-4 w-4" />
							Detail
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
