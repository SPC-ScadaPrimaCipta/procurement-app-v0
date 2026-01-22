"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckSquare, Trash2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
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
import { DataTable } from "@/components/datatable/data-table";
import { columns, DocumentItem } from "./columns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DocumentSkeleton } from "@/components/skeletons/document-skeleton";

export default function DokumenPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [open2, setOpen2] = useState(false);
    const [totalDocuments, setTotalDocuments] = useState<number>(0);
    const [data, setData] = useState<DocumentItem[]>([]);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const response = await fetch("/api/delete-recycle-bin", {
                method: "GET",
            });

            if (!response.ok) throw new Error("Failed to fetch documents");

            const result = await response.json();
            const documents = result?.data ?? [];

            setData(Array.isArray(documents) ? documents : []);
            setTotalDocuments(Array.isArray(documents) ? documents.length : 0);
        } catch (error) {
            console.error("Error fetching documents:", error);
            setData([]);
            setTotalDocuments(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const column = columns(fetchData);

    if (isLoading) {
        return <DocumentSkeleton />;
    }

    const handleDeleteAll = async () => {
        if (data.length === 0) {
            toast.error("Recycle bin sudah kosong.");
            return;
        }

        try {
            setIsLoading(true);

            const documentIds = data.map((doc) => doc.id);

            const response = await fetch("/api/delete-recycle-bin", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: documentIds }),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Recycle bin berhasil dikosongkan.");
                setOpen(false);
                fetchData();
                router.refresh();
            } else {
                toast.error(result.error || "Gagal mengosongkan recycle bin.");
            }
        } catch (error) {
            console.error("Delete Error:", error);
            toast.error("Gagal mengosongkan recycle bin.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRestoreAll = async () => {
        if (data.length === 0) {
            toast.error("Tidak ada dokumen untuk dipulihkan.");
            return;
        }

        try {
            setIsLoading(true);

            const documentIds = data.map((doc) => doc.id);

            const response = await fetch("/api/restore-recycle-bin", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ ids: documentIds }),
            });

            setIsLoading(false);

            if (response.ok) {
                toast.success("Dokumen berhasil dipulihkan.");
                setOpen2(false);
                fetchData();
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || "Gagal memulihkan dokumen.");
            }
        } catch (error) {
            setIsLoading(false);
            console.error("Restore Error:", error);
            toast.error("Gagal memulihkan dokumen.");
        }
    };

    return (
        <div className="md:p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Daftar Dokumen
                    </h1>
                    <p className="text-muted-foreground">
                        List semua dokumen tersedia.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <AlertDialog open={open} onOpenChange={setOpen}>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="destructive"
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Trash2 className="h-4 w-4" />
                                Kosongkan Recycle Bin
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Pengosongan</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Semua dokumen yang berada di dalam Recycle Bin akan dihapus secara permanen.
                                    Tindakan ini tidak dapat dibatalkan. Yakin ingin melanjutkan?
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>
                                    Batal
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteAll}
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Hapus Permanen
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <AlertDialog open={open2} onOpenChange={setOpen2}>
                        <AlertDialogTrigger asChild>
                            <Button
                                className="flex items-center gap-2 bg-green-600 cursor-pointer"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Pulihkan Semua Dokumen
                            </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Pengosongan</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Semua dokumen yang berada di dalam Recycle Bin akan dipulihkan.
                                    Tindakan ini tidak dapat dibatalkan. Yakin ingin melanjutkan?
                                </AlertDialogDescription>
                            </AlertDialogHeader>

                            <AlertDialogFooter>
                                <Button variant="outline" onClick={() => setOpen2(false)}>
                                    Batal
                                </Button>

                                <Button
                                    onClick={handleRestoreAll}
                                    disabled={isLoading}
                                    onSelect={(e) => e.preventDefault()}
                                    className="bg-green-600"
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Pulihkan Semua
                                </Button>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Dokumen
                        </CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDocuments}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="px-4">
                        <DataTable
                            columns={column}
                            data={data}
                            filterKey="doc_name"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
