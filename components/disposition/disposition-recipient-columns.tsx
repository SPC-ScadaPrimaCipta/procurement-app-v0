"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export type DispositionRecipient = {
	id: string;
	name: string;
	is_active: boolean;
	sort_order: number;
	created_at: Date;
};

interface DispositionRecipientColumnsProps {
	onEdit: (recipient: DispositionRecipient) => void;
	onDelete: (recipient: DispositionRecipient) => void;
	onMoveUp: (recipient: DispositionRecipient) => void;
	onMoveDown: (recipient: DispositionRecipient) => void;
	canMoveUp: (recipient: DispositionRecipient) => boolean;
	canMoveDown: (recipient: DispositionRecipient) => boolean;
}

export const createDispositionRecipientColumns = ({
	onEdit,
	onDelete,
	onMoveUp,
	onMoveDown,
	canMoveUp,
	canMoveDown,
}: DispositionRecipientColumnsProps): ColumnDef<DispositionRecipient>[] => [
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Penerima" />
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
			const recipient = row.original;
			return (
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => onMoveUp(recipient)}
						disabled={!canMoveUp(recipient)}
					>
						<ArrowUp className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => onMoveDown(recipient)}
						disabled={!canMoveDown(recipient)}
					>
						<ArrowDown className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => onEdit(recipient)}
					>
						<Edit className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8"
						onClick={() => onDelete(recipient)}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			);
		},
	},
];
