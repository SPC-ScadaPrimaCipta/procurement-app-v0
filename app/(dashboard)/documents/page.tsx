"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, DocumentItem } from "./columns";
import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";

export default function DokumenPage() {
    const [data, setData] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("/api/document");
                if (!response.ok) throw new Error("Failed to fetch data");

                const result = await response.json();
                console.log("Fetched documents:", result);
                const documents = result?.data ?? result ?? [];
                setData(Array.isArray(documents) ? documents : []);
            } catch (error) {
                console.error("Error fetching documents:", error);
                setData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Calculate Stats
    const stats = {
        total: data.length,
        types: [...new Set(data.map((d) => d.ref_type))].length,
    };

    if (isLoading) {
        return <TablePageSkeleton showButton={false} />;
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
            <div className="grid gap-4 md:grid-cols-2">
                <StatsCard
                    title="Total Dokumen"
                    value={stats.total}
                    icon={FileText}
                    iconClassName="text-primary"
                />
                <StatsCard
                    title="Tipe Dokumen"
                    value={stats.types}
                    icon={Folder}
                    iconClassName="text-blue-500"
                />
            </div>

            <Card>
                <CardContent className="p-0">
                    <div className="px-4">
                        <DataTable
                            columns={columns}
                            data={data}
                            filterKey="doc_name"
                            statusFilterKey="ref_type"
                            statusColumnId="ref_type"
                            statusFilterLabel="Tipe Dokumen"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
