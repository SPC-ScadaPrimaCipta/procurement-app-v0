"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";

export type OrgUnit = {
	id: string;
	unit_type: string;
	unit_code: string | null;
	unit_name: string;
	parent_unit_id: string | null;
	is_active: boolean;
	parent?: {
		id: string;
		unit_name: string;
	} | null;
};

interface OrgUnitColumnsProps {
	onEdit: (orgUnit: OrgUnit) => void;
	onDelete: (orgUnit: OrgUnit) => void;
}

export const createOrgUnitColumns = ({
	onEdit,
	onDelete,
}: OrgUnitColumnsProps): ColumnDef<OrgUnit>[] => [
	{
		accessorKey: "unit_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Unit" />
		),
		cell: ({ row }) => {
			return <div className="font-medium">{row.getValue("unit_name")}</div>;
		},
	},
	{
		accessorKey: "unit_type",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipe Unit" />
		),
		cell: ({ row }) => {
			return <div>{row.getValue("unit_type")}</div>;
		},
	},
	{
		accessorKey: "unit_code",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Kode Unit" />
		),
		cell: ({ row }) => {
			const code = row.getValue("unit_code") as string | null;
			return <div>{code || "-"}</div>;
		},
	},
	{
		accessorKey: "parent",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Unit Parent" />
		),
		cell: ({ row }) => {
			const parent = row.original.parent;
			return <div>{parent ? parent.unit_name : "-"}</div>;
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
		id: "actions",
		header: "Aksi",
		cell: ({ row }) => {
			const orgUnit = row.original;
			return (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(orgUnit)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(orgUnit)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			);
		},
	},
];
