"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

export type SupplierType = {
	id: string;
	name: string;
	is_active: boolean;
	created_at: Date;
};

interface SupplierTypeColumnsProps {
	onEdit: (supplierType: SupplierType) => void;
	onDelete: (supplierType: SupplierType) => void;
}

export const createSupplierTypeColumns = ({
	onEdit,
	onDelete,
}: SupplierTypeColumnsProps): ColumnDef<SupplierType>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Jenis Vendor" />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{row.getValue("name")}</div>;
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
				<Badge variant={isActive ? "default" : "secondary"}>
					{isActive ? "Aktif" : "Tidak Aktif"}
				</Badge>
			);
		},
	},
	{
		accessorKey: "created_at",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tanggal Dibuat" />
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("created_at"));
			return <div>{date.toLocaleDateString("id-ID")}</div>;
		},
	},
	{
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const supplierType = row.original;
			return (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(supplierType)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(supplierType)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			);
		},
	},
];
