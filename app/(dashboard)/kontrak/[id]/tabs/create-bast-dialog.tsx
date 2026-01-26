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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!bastNumber || !bastDate || !progress) {
			toast.error("Mohon lengkapi data wajib.");
			return;
		}

		if (!plan) return;

		setIsLoading(true);

		try {
			// 1. Upload file if needed (optional but recommended for BAST)
			let attachmentId = null;
			if (file) {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("refType", "BAST");
				formData.append("refId", contractId);

				const bastDocType = docTypes.find(
					(dt) => dt.name.toUpperCase() === "BAST",
				);
				if (bastDocType) {
					formData.append("doc_type_id", bastDocType.id);
				}
				formData.append("folder_path", `BAST/${contractId}`);

				const uploadRes = await fetch("/api/uploads", {
					method: "POST",
					body: formData,
				});

				if (!uploadRes.ok) throw new Error("Gagal mengupload lampiran");
				const uploadData = await uploadRes.json();
				attachmentId = uploadData.id;
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
		} catch (error: any) {
			toast.error(error.message);
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
