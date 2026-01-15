"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Copy } from "lucide-react";
import Link from "next/link";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";

export type ProcurementCase = {
	id: string;
	case_code: string | null;
	title: string;
	unit: {
		unit_name: string;
	} | null;
	status: {
		name: string;
	};
	created_by_name: string;
	created_at: string;
};

const getStatusColor = (status: string) => {
	switch (status) {
		case "DRAFT":
			return "secondary";
		case "SUBMITTED":
		case "IN_PROGRESS":
			return "default";
		case "APPROVED":
			return "outline"; // or success color if available
		case "REJECTED":
			return "destructive";
		default:
			return "outline";
	}
};

export const columns: ColumnDef<ProcurementCase>[] = [
	{
		accessorKey: "case_code",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Kode Pengadaan" />
		),
		cell: ({ row }) => (
			<div className="font-mono">{row.getValue("case_code") || "-"}</div>
		),
	},
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Judul Pengadaan" />
		),
		cell: ({ row }) => (
			<div
				className="max-w-[400px] truncate font-medium"
				title={row.getValue("title")}
			>
				{row.getValue("title")}
			</div>
		),
	},
	{
		accessorKey: "created_by_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dibuat Oleh" />
		),
		cell: ({ row }) => {
			const creator = row.original.created_by_name;
			return <div>{creator}</div>;
		},
	},
	{
		accessorKey: "status.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.original.status.name;
			return (
				<Badge variant={getStatusColor(status) as any}>{status}</Badge>
			);
		},
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dibuat Pada" />
		),
		cell: ({ row }) => (
			<div className="text-xs text-muted-foreground">
				{new Date(row.getValue("created_at")).toLocaleDateString(
					"id-ID",
					{
						day: "numeric",
						month: "short",
						year: "numeric",
					}
				)}
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
								navigator.clipboard.writeText(
									item.case_code || ""
								)
							}
						>
							<Copy className="mr-2 h-4 w-4" />
							Salin Kode
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href={`/pengadaan/${item.id}`}>
								<Eye className="mr-2 h-4 w-4" />
								Detail
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
