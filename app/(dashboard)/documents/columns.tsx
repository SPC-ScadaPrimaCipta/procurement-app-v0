"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    ArrowRight,
    Mail,
    FileText,
    CheckCircle2,
	Briefcase,
} from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useEffect } from "react";

export type DocumentItem = {
	id: string;
	doc_name: string;
	title: string;
	doc_date: string;
	file_name: string;
	ref_type: string;
};


export const columns: ColumnDef<DocumentItem>[] = [
    {
		accessorKey: "doc_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Document Name" />
		),
		cell: ({ row }) => (
			<div className="font-mono font-medium">
				{row.getValue("doc_name")}
			</div>
		),
	},
    {
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Sujek" />
		),
		cell: ({ row }) => (
			<div className="font-mono font-medium">
				{row.getValue("title")}
			</div>
		),
	},
    {
		accessorKey: "doc_date",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tanggal Dokumen" />
		),
		cell: ({ row }) => (
			<div className="font-mono font-medium">
				{row.getValue("doc_date")}
			</div>
		),
	},
    {
		accessorKey: "file_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama File" />
		),
		cell: ({ row }) => (
			<div className="font-mono font-medium">
				{row.getValue("file_name")}
			</div>
		),
	},
    {
		accessorKey: "ref_type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipe Dokumen" />
		),
		cell: ({ row }) => (
			<div className="font-mono font-medium">
				{row.getValue("ref_type")}
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
						<DropdownMenuItem asChild>
							<Link href={`/documents/${item.id}`}>
								<Briefcase className="mr-2 h-4 w-4" />
								Lihat Detail Dokumen
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
