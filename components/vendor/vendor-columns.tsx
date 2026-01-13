"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { format } from "date-fns";

export type Vendor = {
	id: string;
	vendor_name: string;
	npwp: string | null;
	address: string | null;
	is_active: boolean;
	created_at: Date;
	updated_at: Date | null;
	supplier_type: {
		id: string;
		name: string;
	};
	_count?: {
		contract: number;
	};
};

interface VendorColumnsProps {
	onDelete: (vendor: Vendor) => void;
	onViewDetail: (vendorId: string) => void;
}

export const getVendorColumns = ({
	onDelete,
	onViewDetail,
}: VendorColumnsProps): ColumnDef<Vendor>[] => [
	{
		accessorKey: "vendor_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Vendor" />
		),
		cell: ({ row }) => {
			const name = row.getValue("vendor_name") as string;
			return (
				<div
					onClick={() => onViewDetail(row.original.id)}
					className="font-medium cursor-pointer"
				>
					{name}
				</div>
			);
		},
	},
	{
		accessorKey: "supplier_type.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipe Supplier" />
		),
		cell: ({ row }) => {
			return (
				<div
					onClick={() => onViewDetail(row.original.id)}
					className="cursor-pointer"
				>
					{row.original.supplier_type?.name || "-"}
				</div>
			);
		},
	},
	{
		accessorKey: "npwp",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="NPWP" />
		),
		cell: ({ row }) => {
			const npwp = row.getValue("npwp") as string | null;
			return (
				<div
					onClick={() => onViewDetail(row.original.id)}
					className="font-mono text-sm cursor-pointer"
				>
					{npwp || "-"}
				</div>
			);
		},
	},
	{
		accessorKey: "is_active",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const isActive = row.getValue("is_active") as boolean;
			return (
				<div
					onClick={() => onViewDetail(row.original.id)}
					className="cursor-pointer"
				>
					<Badge variant={isActive ? "default" : "secondary"}>
						{isActive ? "Active" : "Inactive"}
					</Badge>
				</div>
			);
		},
		filterFn: (row, id, value) => {
			return value.includes(row.getValue(id));
		},
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Created At" />
		),
		cell: ({ row }) => {
			const date = row.getValue("created_at") as Date;
			return (
				<div
					onClick={() => onViewDetail(row.original.id)}
					className="text-sm cursor-pointer"
				>
					{format(new Date(date), "dd/MM/yyyy")}
				</div>
			);
		},
	},
	{
		id: "actions",
		header: "Actions",
		cell: ({ row }) => {
			const vendor = row.original;

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
						<DropdownMenuSeparator />
						<DropdownMenuItem asChild>
							<a
								href={`/vendor/${vendor.id}`}
								className="cursor-pointer flex items-center"
							>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</a>
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => onDelete(vendor)}
							className="text-red-600 focus:text-red-600"
						>
							<Trash2 className="mr-2 h-4 w-4" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
