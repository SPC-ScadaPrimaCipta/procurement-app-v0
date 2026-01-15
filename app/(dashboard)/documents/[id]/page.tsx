"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, FileText, Download, Building2, Calendar, User, Tag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type DocumentDetail = {
    id: string;
    doc_name: string | null;
    title: string | null;
    doc_date: string | null;
    file_name: string | null;
    file_url?: string | null;
    ref_type: string | null;
    uploaded_by?: string | null;
    uploaded_by_name?: string | null;
    uploaded_at?: string | null;
    folder_path?: string | null;
};

export default function DocumentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [data, setData] = useState<DocumentDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                const res = await fetch(`/api/document/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Document not found");
                    throw new Error("Failed to fetch document");
                }
                const result = await res.json();
                console.log("Fetched document detail:", result);
                setData(result ?? null);
            } catch (err: any) {
                setError(err?.message || "An error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="md:p-6 space-y-6">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                    <Skeleton className="h-[150px] md:col-span-1" />
                    <Skeleton className="h-[150px]" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="rounded-full bg-red-100 p-3 mb-4">
                    <FileText className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-900">Error Loading Document</h3>
                <p className="text-sm text-red-700 mt-1 max-w-sm">{error}</p>
                <Button variant="outline" className="mt-4" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
                </Button>
            </div>
        );
    }

    const formatDate = (d: string | null) => {
        if (!d) return "-";
        try {
            return format(new Date(d), "dd MMM yyyy");
        } catch {
            return d;
        }
    };

    const formatDateTime = (d: string | null) => {
        if (!d) return "-";
        try {
            return format(new Date(d), "dd MMM yyyy HH:mm");
        } catch {
            return d;
        }
    };

    return (
        <div className="md:p-6 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Detail Dokumen</h1>
                        <p className="text-sm text-muted-foreground">Informasi lengkap dokumen</p>
                    </div>
                </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className=" overflow-hidden">
                        <CardHeader className="bg-muted/10 p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="text-xl">{data.title || 'Untitled'}</CardTitle>
                                    <CardDescription>{data.doc_name || data.ref_type || '-'}</CardDescription>
                                </div>
                                <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                        </CardHeader>
                        <CardContent className=" px-6 grid gap-6">
                            <div>
                                <h3 className="text-medium font-medium text-muted-foreground mb-5">Informasi Dokumen</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm text-muted-foreground">Tanggal Dokumen</h4>
                                        <p className="font-medium">{formatDate(data.doc_date)}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm text-muted-foreground">Nama File</h4>
                                        <p className="font-medium">{data.file_name || '-'}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm text-muted-foreground">Diupload Oleh</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <User className="w-4 h-4 text-muted-foreground" />
                                            <p className="font-medium">{data.uploaded_by_name || data.uploaded_by || '-'}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm text-muted-foreground">Waktu Unggah</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span>{formatDateTime(data.uploaded_at || data.doc_date)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Lampiran</h3>
                                {data.file_url ? (
                                    <Card className="hover:shadow-sm transition-shadow">
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">{data.file_name || data.title || 'Dokumen'}</p>
                                                    <p className="text-xs text-muted-foreground">{data.doc_name} • {formatDateTime(data.uploaded_at || data.doc_date)}</p>
                                                </div>
                                            </div>
                                            <Button variant="outline" size="sm" className="shrink-0 ml-2" asChild>
                                                <a href={`/api/document/${data.id}/download`} target="_blank" rel="noopener noreferrer">
                                                    <Download className="mr-2 h-4 w-4" /> Download
                                                </a>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card className="bg-muted/10 border-dashed">
                                        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                            <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
                                            <p className="text-muted-foreground">Tidak ada dokumen tersedia.</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Informasi Tambahan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Tipe Referensi</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Tag className="w-4 h-4 text-muted-foreground" />
                                    <p className="font-medium">{data.ref_type || '-'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Folder Path</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <p className="font-medium max-w-full">{data.folder_path || '-'}</p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Uploaded By</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <p className="font-medium max-w-full">{data.uploaded_by_name || data.uploaded_by || '-'}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 ml-6">{formatDateTime(data.uploaded_at || data.doc_date)}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
