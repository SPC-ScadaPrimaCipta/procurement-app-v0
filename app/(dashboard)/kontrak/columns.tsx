"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Copy, Briefcase } from "lucide-react";
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
import { format } from "date-fns";

export type Contract = {
	id: string;
	contract_number: string;
	contract_date: string;
	contract_value: number;
	procurement_case: {
		id: string;
		title: string;
		case_code: string | null;
	} | null;
	vendor: {
		vendor_name: string;
	} | null;
	contract_status: {
		name: string;
	};
	created_by_name: string;
	created_at: string;
};

const getStatusColor = (status: string) => {
	switch (status) {
		case "Aktif":
		case "Active":
			return "default"; // green/primary usually
		case "Selesai":
		case "Completed":
			return "secondary";
		case "Terminated":
		case "Dibatalkan":
			return "destructive";
		default:
			return "outline";
	}
};

export const columns: ColumnDef<Contract>[] = [
	{
		accessorKey: "contract_number",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="No. Kontrak" />
		),
		cell: ({ row }) => (
			<div className="font-mono font-medium">
				{row.getValue("contract_number")}
			</div>
		),
	},
	{
		accessorKey: "vendor.vendor_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Penyedia" />
		),
		cell: ({ row }) => {
			return <div>{row.original.vendor?.vendor_name || "-"}</div>;
		},
	},
	{
		accessorKey: "procurement_case.title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Pengadaan" />
		),
		cell: ({ row }) => (
			<div
				className="max-w-[300px] truncate text-muted-foreground text-sm"
				title={row.original.procurement_case?.title}
			>
				{row.original.procurement_case?.title || "-"}
			</div>
		),
	},
	{
		accessorKey: "contract_value",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nilai Kontrak" />
		),
		cell: ({ row }) => {
			const value = parseFloat(row.getValue("contract_value"));
			const formatted = new Intl.NumberFormat("id-ID", {
				style: "currency",
				currency: "IDR",
			}).format(value);

			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "contract_status.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const status = row.original.contract_status?.name || "Unknown";
			return (
				<Badge variant={getStatusColor(status) as any}>{status}</Badge>
			);
		},
	},
	{
		accessorKey: "contract_date",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tgl. Kontrak" />
		),
		cell: ({ row }) => (
			<div className="text-sm text-muted-foreground">
				{format(new Date(row.getValue("contract_date")), "dd/MM/yyyy")}
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
									item.contract_number || ""
								)
							}
						>
							<Copy className="mr-2 h-4 w-4" />
							Salin No. Kontrak
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<Link href={`/kontrak/${item.id}`}>
								<Briefcase className="mr-2 h-4 w-4" />
								Lihat Detail Kontrak
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem asChild>
							{/* Linking back to procurement case */}
							<Link
								href={`/pengadaan/${
									item.procurement_case?.id || ""
								}`}
							>
								<Eye className="mr-2 h-4 w-4" />
								Lihat Pengadaan
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
