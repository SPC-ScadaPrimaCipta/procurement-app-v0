"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    ArrowRight,
    Mail,
    FileText,
    CheckCircle2,
    Briefcase,
    Trash2,
    RotateCcw,
} from "lucide-react";
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
import { formatDistanceToNow } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type DocumentItem = {
    id: string;
    doc_name: string;
    title: string;
    doc_date: string;
    file_name: string;
    ref_type: string;
};


export const columns: (fetchData: () => Promise<void>) => ColumnDef<DocumentItem>[] = (fetchData) => [
    {
        accessorKey: "doc_name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Document Name" />
        ),
        cell: ({ row }) => (
            <div className="font-mono font-medium">
                {row.getValue("doc_name")}
            </div>
        ),
    },
    {
        accessorKey: "title",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Sujek" />
        ),
        cell: ({ row }) => (
            <div className="font-mono font-medium">
                {row.getValue("title")}
            </div>
        ),
    },
    {
        accessorKey: "doc_date",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Tanggal Dokumen" />
        ),
        cell: ({ row }) => (
            <div className="font-mono font-medium">
                {row.getValue("doc_date")}
            </div>
        ),
    },
    {
        accessorKey: "file_name",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Nama File" />
        ),
        cell: ({ row }) => (
            <div className="font-mono font-medium">
                {row.getValue("file_name")}
            </div>
        ),
    },
    {
        accessorKey: "ref_type",
        header: ({ column }) => (
            <DataTableColumnHeader column={column} title="Tipe Dokumen" />
        ),
        cell: ({ row }) => (
            <div className="font-mono font-medium">
                {row.getValue("ref_type")}
            </div>
        ),
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original;
            const router = useRouter();

            const handleDelete = async (item: DocumentItem) => {
                const res = await fetch(`/api/delete-recycle-bin/${item.id}`, {
                    method: "DELETE",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ id: item.id }),
                });

                if (res.ok) {
                    toast.success("Dokumen berhasil dihapus");
                    router.refresh();
                    fetchData();
                } else {
                    toast.error("Gagal menghapus dokumen");
                }
            };

            const handleRestore = async (item: DocumentItem) => {
                const res = await fetch(`/api/restore-recycle-bin/${item.id}`, {
                    method: "PUT",
                });

                if (res.ok) {
                    toast.success("Dokumen berhasil direstore");
                    router.refresh();
                    fetchData();
                } else {
                    toast.error("Gagal merestore dokumen");
                }
            };

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Aksi</DropdownMenuLabel>

                        <DropdownMenuItem asChild>
                            <Link href={`/recycle-bin/${item.id}`}>
                                <Briefcase className="mr-2 h-4 w-4" />
                                Lihat Detail Dokumen
                            </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* Restore Action */}
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="text-green-600 focus:text-green-600 cursor-pointer"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Restore Dokumen
                                </DropdownMenuItem>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Restore Dokumen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Dokumen akan dikembalikan ke daftar dokumen aktif.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={async () => await handleRestore(item)}
                                    >
                                        Restore
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Hapus Dokumen
                                </DropdownMenuItem>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Tindakan ini tidak bisa dibatalkan. Dokumen akan dihapus permanen.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>

                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={async () => await handleDelete(item)}
                                    >
                                        Hapus
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        }
    }
];
