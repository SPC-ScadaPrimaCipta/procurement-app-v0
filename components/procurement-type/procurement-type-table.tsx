"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/components/datatable/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
    createProcurementTypeColumns,
    ProcurementType,
} from "./procurement-type-columns";
import { ProcurementTypeFormDialog } from "./procurement-type-form-dialog";
import { ProcurementTypeDeleteDialog } from "./procurement-type-delete-dialog";

export function ProcurementTypeTable() {
    const [procurementTypes, setProcurementTypes] = useState<ProcurementType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Dialog states
    const [formDialogOpen, setFormDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedProcurementType, setSelectedProcurementType] = useState<ProcurementType | null>(null);
    const [editingProcurementType, setEditingProcurementType] = useState<ProcurementType | null>(null);

    useEffect(() => {
        const fetchProcurementTypes = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/master/procurement-type");
                if (!response.ok) throw new Error("Failed to fetch procurement types");

                const data = await response.json();

                // Filter by search query if exists
                let filteredData = data;
                if (searchQuery) {
                    filteredData = data.filter((item: ProcurementType) =>
                        item.name.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                }

                setProcurementTypes(filteredData);
            } catch (error) {
                toast.error("Gagal memuat data jenis pengadaan");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProcurementTypes();
    }, [refreshTrigger, searchQuery]);

    const refetchProcurementTypes = () => {
        setRefreshTrigger((prev) => prev + 1);
    };

    const handleAddNew = () => {
        setEditingProcurementType(null);
        setFormDialogOpen(true);
    };

    const handleEdit = (procurementType: ProcurementType) => {
        setEditingProcurementType(procurementType);
        setFormDialogOpen(true);
    };

    const handleDelete = (procurementType: ProcurementType) => {
        setSelectedProcurementType(procurementType);
        setDeleteDialogOpen(true);
    };

    const handleFormSuccess = () => {
        setFormDialogOpen(false);
        refetchProcurementTypes();
        setHasChanges(false);
        toast.success(
            editingProcurementType
                ? "jenis pengadaan berhasil diupdate"
                : "jenis pengadaan berhasil ditambahkan"
        );
    };

    const handleDeleteSuccess = () => {
        setDeleteDialogOpen(false);
        refetchProcurementTypes();
        toast.success("jenis pengadaan berhasil dihapus");
    };

    const handleMoveUp = (type: ProcurementType) => {
        const currentIndex = procurementTypes.findIndex((m) => m.id === type.id);
        if (currentIndex <= 0) return;

        const newTypes = [...procurementTypes];
        [newTypes[currentIndex - 1], newTypes[currentIndex]] = [
            newTypes[currentIndex],
            newTypes[currentIndex - 1],
        ];

        newTypes.forEach((m, idx) => {
            m.sort_order = idx + 1;
        });

        setProcurementTypes(newTypes);
        setHasChanges(true);
    };

    const handleMoveDown = (type: ProcurementType) => {
        const currentIndex = procurementTypes.findIndex((m) => m.id === type.id);
        if (currentIndex >= procurementTypes.length - 1) return;

        const newTypes = [...procurementTypes];
        [newTypes[currentIndex], newTypes[currentIndex + 1]] = [
            newTypes[currentIndex + 1],
            newTypes[currentIndex],
        ];

        newTypes.forEach((m, idx) => {
            m.sort_order = idx + 1;
        });

        setProcurementTypes(newTypes);
        setHasChanges(true);
    };

    const canMoveUp = (type: ProcurementType) => {
        return procurementTypes.findIndex((m) => m.id === type.id) > 0;
    };

    const canMoveDown = (type: ProcurementType) => {
        const idx = procurementTypes.findIndex((m) => m.id === type.id);
        return idx >= 0 && idx < procurementTypes.length - 1;
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            const updates = procurementTypes.map((type) => ({
                id: type.id,
                sort_order: type.sort_order,
            }));

            const response = await fetch("/api/master/procurement-type/reorder", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ types: updates }),
            });

            if (!response.ok) {
                throw new Error("Failed to update sort order");
            }

            toast.success("Urutan berhasil disimpan");
            setHasChanges(false);
            refetchProcurementTypes();
        } catch (error) {
            toast.error("Gagal menyimpan urutan");
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const columns = createProcurementTypeColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onMoveUp: handleMoveUp,
        onMoveDown: handleMoveDown,
        canMoveUp,
        canMoveDown,
    });

    return (
        <>
            {/* Actions Bar */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari jenis pengadaan..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex gap-2">
                    {hasChanges && (
                        <Button
                            onClick={handleSaveChanges}
                            disabled={isSaving}
                            variant="default"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    )}
                    <Button onClick={handleAddNew}>
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah jenis Pengadaan
                    </Button>
                </div>
            </div>

            {/* Table */}
            <DataTable columns={columns} data={procurementTypes} />

            {/* Dialogs */}
            <ProcurementTypeFormDialog
                open={formDialogOpen}
                onOpenChange={setFormDialogOpen}
                procurementType={editingProcurementType}
                onSuccess={handleFormSuccess}
            />

            <ProcurementTypeDeleteDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                procurementType={selectedProcurementType}
                onSuccess={handleDeleteSuccess}
            />
        </>
    );
}
