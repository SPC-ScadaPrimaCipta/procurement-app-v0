"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";

export type Peraturan = {
	id: string;
	doc_number: string;
	title: string;
	type: {
		name: string;
	};
	files: Array<{
		id: string;
		file_name: string;
	}>;
	created_at: string;
};

interface PeraturanColumnsProps {
	onViewDetail: (peraturan: Peraturan) => void;
}

export const createPeraturanColumns = ({
	onViewDetail,
}: PeraturanColumnsProps): ColumnDef<Peraturan>[] => [
	{
		accessorKey: "doc_number",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nomor Dokumen" />
		),
		cell: ({ row }) => (
			<div
				className="cursor-pointer hover:text-primary"
				onClick={() => onViewDetail(row.original)}
			>
				{row.getValue("doc_number")}
			</div>
		),
	},
	{
		accessorKey: "title",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Judul Dokumen" />
		),
		cell: ({ row }) => (
			<div
				className="cursor-pointer hover:text-primary max-w-lg truncate"
				onClick={() => onViewDetail(row.original)}
			>
				{row.getValue("title")}
			</div>
		),
	},
	{
		accessorKey: "type.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tipe Dokumen" />
		),
		cell: ({ row }) => (
			<div
				className="cursor-pointer hover:text-primary"
				onClick={() => onViewDetail(row.original)}
			>
				{row.original.type.name}
			</div>
		),
	},
];
