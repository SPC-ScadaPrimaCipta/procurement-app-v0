"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";

export type ProcurementType = {
    id: string;
    name: string;
    is_active: boolean;
    sort_order: number;
    created_at: Date;
};

interface ProcurementTypeColumnsProps {
    onEdit: (procurementType: ProcurementType) => void;
    onDelete: (procurementType: ProcurementType) => void;
    onMoveUp: (procurementType: ProcurementType) => void;
    onMoveDown: (procurementType: ProcurementType) => void;
    canMoveUp: (procurementType: ProcurementType) => boolean;
    canMoveDown: (procurementType: ProcurementType) => boolean;
}

export const createProcurementTypeColumns = ({
    onEdit,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
}: ProcurementTypeColumnsProps): ColumnDef<ProcurementType>[] => [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nama jenis Pengadaan" />
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
            const procurementType = row.original;
            return (
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveUp(procurementType)}
                        disabled={!canMoveUp(procurementType)}
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onMoveDown(procurementType)}
                        disabled={!canMoveDown(procurementType)}
                    >
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(procurementType)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(procurementType)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            );
        },
    },
];
