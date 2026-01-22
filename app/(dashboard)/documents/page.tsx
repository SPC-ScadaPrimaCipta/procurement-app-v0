"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, DocumentItem } from "./columns";
import { DocumentSkeleton } from "@/components/skeletons/document-skeleton";

export default function DokumenPage() {
    const [data, setData] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalDocuments, setTotalDocuments] = useState<number>(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/document");
                if (!response.ok) throw new Error("Failed to fetch data");

                const result = await response.json();
                console.log("Fetched documents:", result);
                const documents = result?.data ?? result ?? [];
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

        fetchData();
    }, []);

    if (isLoading) {
        return <DocumentSkeleton />;
    }

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
            </div>

            {/* Quick Stats */}
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
                            columns={columns}
                            data={data}
                            filterKey="doc_name"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
