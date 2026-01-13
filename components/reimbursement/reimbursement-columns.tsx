"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Badge } from "@/components/ui/badge";

export type Reimbursement = {
	id: string;
	reimbursement_no: string;
	no_validasi_ppk: string;
	tgl_validasi_ppk: Date;
	nomor_kwitansi: string;
	tanggal_kwitansi: Date;
	uraian_pekerjaan: string;
	nilai_kwitansi: number;
	keterangan: string | null;
	vendor: {
		id: string;
		vendor_name: string;
	};
	status: {
		id: string;
		name: string;
	};
	created_at: Date;
};

export const createReimbursementColumns = (
	onRowClick: (reimbursement: Reimbursement) => void
): ColumnDef<Reimbursement>[] => [
	{
		accessorKey: "reimbursement_no",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="No Reimbursement" />
		),
		cell: ({ row }) => {
			return (
				<div
					className="font-medium cursor-pointer hover:underline"
					onClick={() => onRowClick(row.original)}
				>
					{row.getValue("reimbursement_no")}
				</div>
			);
		},
	},
	{
		accessorKey: "no_validasi_ppk",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="No Validasi PPK" />
		),
	},
	{
		accessorKey: "tgl_validasi_ppk",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tanggal Validasi PPK" />
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("tgl_validasi_ppk"));
			return <div>{date.toLocaleDateString("id-ID")}</div>;
		},
	},
	{
		accessorKey: "vendor.vendor_name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nama Penyedia" />
		),
		cell: ({ row }) => {
			return <div>{row.original.vendor?.vendor_name || "-"}</div>;
		},
	},
	{
		accessorKey: "uraian_pekerjaan",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Uraian Pekerjaan" />
		),
		cell: ({ row }) => {
			const uraian = row.getValue("uraian_pekerjaan") as string;
			return (
				<div className="max-w-[300px] truncate" title={uraian}>
					{uraian}
				</div>
			);
		},
	},
	{
		accessorKey: "nomor_kwitansi",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nomor Kwitansi" />
		),
	},
	{
		accessorKey: "tanggal_kwitansi",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Tanggal Kwitansi" />
		),
		cell: ({ row }) => {
			const date = new Date(row.getValue("tanggal_kwitansi"));
			return <div>{date.toLocaleDateString("id-ID")}</div>;
		},
	},
	{
		accessorKey: "nilai_kwitansi",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Nilai Kwitansi" />
		),
		cell: ({ row }) => {
			const amount = parseFloat(row.getValue("nilai_kwitansi"));
			const formatted = new Intl.NumberFormat("id-ID", {
				style: "currency",
				currency: "IDR",
				minimumFractionDigits: 0,
			}).format(amount);
			return <div className="font-medium">{formatted}</div>;
		},
	},
	{
		accessorKey: "status.name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			return <Badge variant="outline">{row.original.status.name}</Badge>;
		},
	},
	{
		accessorKey: "keterangan",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Keterangan" />
		),
		cell: ({ row }) => {
			const keterangan = row.getValue("keterangan") as string | null;
			return (
				<div className="max-w-[200px] truncate" title={keterangan || ""}>
					{keterangan || "-"}
				</div>
			);
		},
	},
];
