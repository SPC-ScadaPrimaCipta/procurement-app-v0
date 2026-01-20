"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ProcurementType } from "./procurement-type-columns";

interface ProcurementTypeDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    procurementType: ProcurementType | null;
    onSuccess: () => void;
}

export function ProcurementTypeDeleteDialog({
    open,
    onOpenChange,
    procurementType,
    onSuccess,
}: ProcurementTypeDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!procurementType) return;

        setIsDeleting(true);

        try {
            const response = await fetch(`/api/master/procurement-type/${procurementType.id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete procurement type");
            }

            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Gagal menghapus jenis pengadaan");
        } finally {
            setIsDeleting(false);
        }
    };

    if (!procurementType) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader className="pr-8">
                    <DialogTitle>Hapus jenis Pengadaan</DialogTitle>
                    <DialogDescription>
                        Apakah Anda yakin ingin menghapus jenis pengadaan ini? Tindakan
                        ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Nama jenis Pengadaan:</span>
                            <span className="font-semibold">{procurementType.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Urutan:</span>
                            <span>{procurementType.sort_order}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Status:</span>
                            <Badge variant={procurementType.is_active ? "default" : "secondary"}>
                                {procurementType.is_active ? "Aktif" : "Tidak Aktif"}
                            </Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isDeleting}
                    >
                        Batal
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Menghapus..." : "Hapus"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
