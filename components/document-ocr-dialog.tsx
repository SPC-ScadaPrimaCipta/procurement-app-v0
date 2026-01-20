"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface OCRResult {
    nomor_surat: string | null;
    tanggal_surat: string | null;
    dari_asal: string | null;
    cc_tembusan: string | null;
    perihal: string | null;
}

export function DocumentOCRDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [formData, setFormData] = useState<OCRResult>({
        nomor_surat: "",
        tanggal_surat: "",
        dari_asal: "",
        cc_tembusan: "",
        perihal: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setError(null);
        setSuccess(false);

        // Create preview for images
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const handleProcessOCR = async () => {
        if (!selectedFile) {
            setError("Pilih file terlebih dahulu");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("file", selectedFile);

            const res = await fetch("/api/document/ocr", {
                method: "POST",
                body: formDataToSend,
            });

            const result = await res.json();

            if (!res.ok) {
                const errorMsg = result.details || result.error || "OCR processing failed";
                console.error("OCR API Error:", result);
                throw new Error(errorMsg);
            }

            // Auto-fill form with OCR results
            setFormData({
                nomor_surat: result.data.nomor_surat || "",
                tanggal_surat: result.data.tanggal_surat || "",
                dari_asal: result.data.dari_asal || "",
                cc_tembusan: result.data.cc_tembusan || "",
                perihal: result.data.perihal || "",
            });

            setSuccess(true);
        } catch (err) {
            console.error("OCR Error:", err);
            setError(err instanceof Error ? err.message : "Gagal memproses dokumen");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setFormData({
            nomor_surat: "",
            tanggal_surat: "",
            dari_asal: "",
            cc_tembusan: "",
            perihal: "",
        });
        setError(null);
        setSuccess(false);
    };

    const handleClose = () => {
        handleReset();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Sparkles className="mr-2 h-4 w-4" />
                    OCR Tool
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[95vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        OCR - Auto Extract Metadata Surat
                    </DialogTitle>
                    <DialogDescription>
                        Upload scan surat/nota dinas (JPG/PNG/PDF) untuk otomatis mengisi metadata dengan OCR
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Upload Section and Results in 2 columns when results available */}
                    <div className={success ? "grid lg:grid-cols-2 gap-6" : "space-y-4"}>
                        {/* Upload Section */}
                        <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="file-upload">Upload Dokumen</Label>
                            <Input
                                id="file-upload"
                                type="file"
                                accept=".jpg,.jpeg,.png,.pdf"
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Format: JPG, PNG, PDF (Max 10MB) - PDF first page only
                            </p>
                        </div>

                        {/* File Preview */}
                        {previewUrl && (
                            <div className="border rounded-lg p-3 bg-muted/50">
                                <p className="text-sm font-medium mb-2">Preview:</p>
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="max-h-48 w-full object-contain rounded"
                                />
                            </div>
                        )}

                        {selectedFile && !previewUrl && (
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                                <FileText className="h-5 w-5 text-primary" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Process Button */}
                        <div className="flex gap-2">
                            <Button
                                onClick={handleProcessOCR}
                                disabled={!selectedFile || loading}
                                className="flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processing OCR...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-4 w-4" />
                                        Process OCR
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={handleReset} disabled={loading}>
                                Reset
                            </Button>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                                <AlertCircle className="h-4 w-4 text-red-600" />
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <p className="text-sm text-green-800">
                                    ✨ Metadata berhasil diekstrak! Lihat hasil di bawah.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Results Form */}
                    {success && (
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Hasil Ekstraksi Metadata
                            </h3>

                            {/* Nomor Surat */}
                            <div className="space-y-2">
                                <Label htmlFor="nomor_surat">Nomor Surat</Label>
                                <Input
                                    id="nomor_surat"
                                    value={formData.nomor_surat || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nomor_surat: e.target.value })
                                    }
                                    placeholder="Tidak terdeteksi"
                                />
                            </div>

                            {/* Tanggal Surat */}
                            <div className="space-y-2">
                                <Label htmlFor="tanggal_surat">Tanggal Surat</Label>
                                <Input
                                    id="tanggal_surat"
                                    value={formData.tanggal_surat || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tanggal_surat: e.target.value })
                                    }
                                    placeholder="dd/mm/yyyy"
                                />
                            </div>

                            {/* Dari (Asal Surat) */}
                            <div className="space-y-2">
                                <Label htmlFor="dari_asal">Dari (Asal Surat)</Label>
                                <Input
                                    id="dari_asal"
                                    value={formData.dari_asal || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, dari_asal: e.target.value })
                                    }
                                    placeholder="Nama Instansi / Divisi"
                                />
                            </div>

                            {/* CC (Tembusan) */}
                            <div className="space-y-2">
                                <Label htmlFor="cc_tembusan">CC (Tembusan)</Label>
                                <Input
                                    id="cc_tembusan"
                                    value={formData.cc_tembusan || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, cc_tembusan: e.target.value })
                                    }
                                    placeholder="Optional"
                                />
                            </div>

                            {/* Perihal */}
                            <div className="space-y-2">
                                <Label htmlFor="perihal">Perihal</Label>
                                <Textarea
                                    id="perihal"
                                    value={formData.perihal || ""}
                                    onChange={(e) =>
                                        setFormData({ ...formData, perihal: e.target.value })
                                    }
                                    placeholder="Inti atau perihal surat..."
                                    rows={3}
                                />
                            </div>

                            {/* JSON Output */}
                            <div className="border rounded-lg p-3 bg-muted/50">
                                <p className="text-xs font-medium mb-2">JSON Output:</p>
                                <pre className="text-xs overflow-auto max-h-32">
                                    {JSON.stringify(formData, null, 2)}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4">
                    <Button variant="outline" onClick={handleClose}>
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
