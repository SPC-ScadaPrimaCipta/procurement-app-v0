import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateBastDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	contractId: string;
	plan: { id: string; line_no: number } | null;
	onSuccess: () => void;
}

export function CreateBastDialog({
	open,
	onOpenChange,
	contractId,
	plan,
	onSuccess,
}: CreateBastDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [bastNumber, setBastNumber] = useState("");
	const [bastDate, setBastDate] = useState("");
	const [progress, setProgress] = useState("");
	const [notes, setNotes] = useState("");
	const [file, setFile] = useState<File | null>(null);
	const [docTypes, setDocTypes] = useState<{ id: string; name: string }[]>(
		[],
	);

	const router = useRouter();

	useEffect(() => {
		if (open) {
			// Reset form when opened
			setBastNumber("");
			setBastDate(new Date().toISOString().split("T")[0]);
			setProgress("");
			setNotes("");
			setFile(null);
			fetchDocTypes();
		}
	}, [open]);

	const fetchDocTypes = async () => {
		try {
			const res = await fetch("/api/master/doc-type");
			if (res.ok) {
				const data = await res.json();
				setDocTypes(data);
			}
		} catch (error) {
			console.error("Failed to fetch doc types", error);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFile(e.target.files[0]);
		}
	};

	const uploadFile = async (
		refId: string,
		file: File,
		docTypeName: string,
		folderContext: string,
	): Promise<string | null> => {
		// Find doc_type_id
		const docType = docTypes.find(
			(dt) => dt.name.toLowerCase() === docTypeName.toLowerCase(),
		);

		// If doc type not found, we might want to warn or proceed without it?
		// The reference defaults to empty string if not found.
		const docTypeId = docType?.id || "";

		const data = new FormData();
		data.append("files", file);
		data.append("ref_type", "BAST");
		data.append("ref_id", refId);
		if (docTypeId) {
			data.append("doc_type_id", docTypeId);
		}

		// Folder path: BAST/<contractId>
		// We use the passed folderContext (which is contractId here)
		const folderPath = `BAST/${folderContext}`;
		data.append("folder_path", folderPath);

		console.log(
			`Uploading ${docTypeName} to ${folderPath} with docType ${docTypeId}`,
		);

		const response = await fetch("/api/uploads", {
			method: "POST",
			body: data,
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Gagal upload ${docTypeName}: ${errText}`);
		}

		const result = await response.json();
		if (Array.isArray(result) && result.length > 0) {
			return result[0].dbId || null;
		}
		return null;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!bastNumber || !bastDate || !progress) {
			toast.error("Mohon lengkapi data wajib.");
			return;
		}

		if (!plan) return;

		setIsLoading(true);

		try {
			// 1. Upload File first (if present)
			let attachmentId: string | null = null;
			if (file) {
				// We use contractId as refId because BAST ID doesn't exist yet
				attachmentId = await uploadFile(
					contractId,
					file,
					"BAST",
					contractId,
				);
			}

			// 2. Create BAST record
			const res = await fetch("/api/contracts/bast", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					contractId,
					paymentPlanId: plan.id,
					bastNumber,
					bastDate,
					progress: parseFloat(progress),
					notes,
					attachment: attachmentId,
				}),
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Gagal membuat BAST");
			}

			toast.success("BAST berhasil dibuat");
			onSuccess();
			onOpenChange(false);

			router.refresh();
		} catch (error: any) {
			console.error("Error submitting BAST:", error);
			toast.error(
				error.message || "Terjadi kesalahan saat menyimpan data.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Buat Berita Acara (BAST)</DialogTitle>
					<DialogDescription>
						Input data BAST untuk pembayaran tahap {plan?.line_no}.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="bastNumber">Nomor BAST</Label>
							<Input
								id="bastNumber"
								placeholder="No. BAST"
								value={bastNumber}
								onChange={(e) => setBastNumber(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bastDate">Tanggal</Label>
							<Input
								id="bastDate"
								type="date"
								value={bastDate}
								onChange={(e) => setBastDate(e.target.value)}
								required
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="progress">Progress (%)</Label>
						<Input
							id="progress"
							type="number"
							min="0"
							max="100"
							step="0.01"
							placeholder="0 - 100"
							value={progress}
							onChange={(e) => setProgress(e.target.value)}
							required
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">Catatan</Label>
						<Textarea
							id="notes"
							placeholder="Keterangan tambahan..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="file">Lampiran Dokumen</Label>
						<Input
							id="file"
							type="file"
							onChange={handleFileChange}
							className="cursor-pointer"
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isLoading}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Menyimpan..." : "Simpan BAST"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
