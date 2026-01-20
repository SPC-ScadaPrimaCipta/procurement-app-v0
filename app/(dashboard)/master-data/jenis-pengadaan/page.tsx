"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ProcurementTypeTable } from "@/components/procurement-type/procurement-type-table";

export default function JenisPengadaanPage() {
    return (
        <div className="md:p-6 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Jenis Pengadaan</h1>
                <p className="text-muted-foreground">
                    Kelola jenis pengadaan untuk proses procurement
                </p>
            </div>

            {/* Content */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <ProcurementTypeTable />
                </CardContent>
            </Card>
        </div>
    );
}
