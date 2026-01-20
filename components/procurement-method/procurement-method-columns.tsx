"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export type ProcurementMethod = {
	id: string;
	name: string;
	is_active: boolean;
	sort_order: number;
	created_at: Date;
};

interface ProcurementMethodColumnsProps {
	onEdit: (procurementMethod: ProcurementMethod) => void;
	onDelete: (procurementMethod: ProcurementMethod) => void;
	onMoveUp: (procurementMethod: ProcurementMethod) => void;
	onMoveDown: (procurementMethod: ProcurementMethod) => void;
	canMoveUp: (procurementMethod: ProcurementMethod) => boolean;
	canMoveDown: (procurementMethod: ProcurementMethod) => boolean;
}

export const createProcurementMethodColumns = ({
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}: ProcurementMethodColumnsProps): ColumnDef<ProcurementMethod>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Jenis Pengadaan" />
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
			const procurementMethod = row.original;
			return (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMoveUp(procurementMethod)}
						disabled={!canMoveUp(procurementMethod)}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMoveDown(procurementMethod)}
						disabled={!canMoveDown(procurementMethod)}
					>
						<ArrowDown className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(procurementMethod)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(procurementMethod)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			);
		},
	},
];
