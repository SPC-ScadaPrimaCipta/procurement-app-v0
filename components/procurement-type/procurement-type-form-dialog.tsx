"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ProcurementType } from "./procurement-type-columns";

interface ProcurementTypeFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    procurementType: ProcurementType | null;
    onSuccess: () => void;
}

export function ProcurementTypeFormDialog({
    open,
    onOpenChange,
    procurementType,
    onSuccess,
}: ProcurementTypeFormDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        is_active: true,
    });

    useEffect(() => {
        if (procurementType) {
            setFormData({
                name: procurementType.name,
                is_active: procurementType.is_active,
            });
        } else {
            setFormData({
                name: "",
                is_active: true,
            });
        }
    }, [procurementType, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error("Nama jenis pengadaan harus diisi");
            return;
        }

        setIsSubmitting(true);

        try {
            const url = procurementType
                ? `/api/master/procurement-type/${procurementType.id}`
                : "/api/master/procurement-type";
            const type = procurementType ? "PUT" : "POST";

            const response = await fetch(url, {
                method: type,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save procurement type");
            }

            onSuccess();
        } catch (error: any) {
            toast.error(error.message || "Gagal menyimpan jenis pengadaan");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader className="pr-8">
                    <DialogTitle>
                        {procurementType ? "Edit jenis Pengadaan" : "Tambah jenis Pengadaan"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nama jenis Pengadaan <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                            }
                            placeholder="Contoh: Lelang Umum, Penunjukan Langsung, Pengadaan Langsung"
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Label htmlFor="is_active">Status Aktif</Label>
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, is_active: checked })
                            }
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Menyimpan..." : "Simpan"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
