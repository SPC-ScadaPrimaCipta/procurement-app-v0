"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export type RegulationType = {
	id: string;
	name: string;
	is_active: boolean;
	sort_order: number;
	created_at: Date;
};

interface RegulationTypeColumnsProps {
	onEdit: (regulationType: RegulationType) => void;
	onDelete: (regulationType: RegulationType) => void;
	onMoveUp: (regulationType: RegulationType) => void;
	onMoveDown: (regulationType: RegulationType) => void;
	canMoveUp: (regulationType: RegulationType) => boolean;
	canMoveDown: (regulationType: RegulationType) => boolean;
}

export const createRegulationTypeColumns = ({
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}: RegulationTypeColumnsProps): ColumnDef<RegulationType>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Jenis Regulasi" />
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
			const regulationType = row.original;
			return (
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMoveUp(regulationType)}
						disabled={!canMoveUp(regulationType)}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onMoveDown(regulationType)}
						disabled={!canMoveDown(regulationType)}
					>
						<ArrowDown className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onEdit(regulationType)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => onDelete(regulationType)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			);
		},
	},
];
