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

export type InboxItem = {
	id: string;
	title: string;
	message: string;
	type: "approval" | "notification" | "task";
	reference_code: string | null;
	from: string;
	status: "unread" | "read";
	created_at: string;
	link: string;
};

const getTypeIcon = (type: string) => {
	switch (type) {
		case "approval":
			return <CheckCircle2 className="w-4 h-4 text-orange-500" />;
		case "task":
			return <FileText className="w-4 h-4 text-blue-500" />;
		default:
			return <Mail className="w-4 h-4 text-gray-500" />;
	}
};

const getTypeBadge = (type: string) => {
	switch (type) {
		case "approval":
			return (
				<Badge
					variant="default"
					className="bg-orange-500 hover:bg-orange-600"
				>
					Approval
				</Badge>
			);
		case "task":
			return <Badge variant="secondary">Task</Badge>;
		default:
			return <Badge variant="outline">Info</Badge>;
	}
};

export const columns: ColumnDef<InboxItem>[] = [
	{
		accessorKey: "type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipe" />
		),
		cell: ({ row }) => (
			<div className="flex items-center gap-2">
				{getTypeIcon(row.original.type)}
				<span className="capitalize text-sm font-medium">
					{row.original.type}
				</span>
			</div>
		),
	},
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Subjek" />
		),
		cell: ({ row }) => (
			<div className="flex flex-col space-y-1">
				<span
					className={`font-medium ${
						row.original.status === "unread"
							? "text-foreground"
							: "text-muted-foreground"
					}`}
				>
					{row.getValue("title")}
				</span>
				<span className="text-xs text-muted-foreground truncate max-w-[300px]">
					{row.original.message}
				</span>
			</div>
		),
	},
	{
		accessorKey: "reference_code",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Ref. Code" />
		),
		cell: ({ row }) => (
			<div className="font-mono text-xs text-muted-foreground">
				{row.getValue("reference_code") || "-"}
			</div>
		),
	},
	{
		accessorKey: "from",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Dari" />
		),
		cell: ({ row }) => (
			<div className="text-sm">{row.getValue("from")}</div>
		),
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Waktu" />
		),
		cell: ({ row }) => (
			<div className="text-sm text-muted-foreground whitespace-nowrap">
				{formatDistanceToNow(new Date(row.getValue("created_at")), {
					addSuffix: true,
					locale: idLocale,
				})}
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
							<Link href={item.link}>
								<ArrowRight className="mr-2 h-4 w-4" />
								Lihat Detail
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
