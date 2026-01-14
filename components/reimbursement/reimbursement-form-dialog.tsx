"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { type Reimbursement } from "./reimbursement-columns";

interface ReimbursementFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	reimbursement: Reimbursement | null;
	editMode: boolean;
	onSuccess: () => void;
}

type Vendor = {
	id: string;
	vendor_name: string;
};

type Status = {
	id: string;
	name: string;
};

export function ReimbursementFormDialog({
	open,
	onOpenChange,
	reimbursement,
	editMode,
	onSuccess,
}: ReimbursementFormDialogProps) {
	const [loading, setLoading] = useState(false);
	const [vendors, setVendors] = useState<Vendor[]>([]);
	const [statuses, setStatuses] = useState<Status[]>([]);

	// Form state
	const [formData, setFormData] = useState({
		no_validasi_ppk: "",
		tgl_validasi_ppk: "",
		vendor_id: "",
		nomor_kwitansi: "",
		tanggal_kwitansi: "",
		uraian_pekerjaan: "",
		nilai_kwitansi: "",
		status_id: "",
		keterangan: "",
	});

	// Load dropdowns and populate form
	useEffect(() => {
		if (open) {
			fetchVendors();
			fetchStatuses();

			if (editMode && reimbursement) {
				setFormData({
					no_validasi_ppk: reimbursement.no_validasi_ppk,
					tgl_validasi_ppk: new Date(reimbursement.tgl_validasi_ppk)
						.toISOString()
						.split("T")[0],
					vendor_id: reimbursement.vendor?.id || "",
					nomor_kwitansi: reimbursement.nomor_kwitansi,
					tanggal_kwitansi: new Date(reimbursement.tanggal_kwitansi)
						.toISOString()
						.split("T")[0],
					uraian_pekerjaan: reimbursement.uraian_pekerjaan,
					nilai_kwitansi: reimbursement.nilai_kwitansi.toString(),
					status_id: reimbursement.status.id,
					keterangan: reimbursement.keterangan || "",
				});
			} else {
				resetForm();
			}
		}
	}, [open, editMode, reimbursement]);

	const fetchVendors = async () => {
		try {
			const response = await fetch("/api/master/vendors");
			if (!response.ok) throw new Error("Failed to fetch vendors");
			const data = await response.json();
			setVendors(data);
		} catch (error) {
			toast.error("Gagal memuat data vendor");
			console.error(error);
		}
	};

	const fetchStatuses = async () => {
		try {
			const response = await fetch("/api/master/reimbursement-statuses");
			if (!response.ok) throw new Error("Failed to fetch statuses");
			const data = await response.json();
			setStatuses(data);
		} catch (error) {
			toast.error("Gagal memuat data status");
			console.error(error);
		}
	};

	const resetForm = () => {
		setFormData({
			no_validasi_ppk: "",
			tgl_validasi_ppk: "",
			vendor_id: "",
			nomor_kwitansi: "",
			tanggal_kwitansi: "",
			uraian_pekerjaan: "",
			nilai_kwitansi: "",
			status_id: "",
			keterangan: "",
		});
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const url = editMode
				? `/api/reimbursement/${reimbursement?.id}`
				: "/api/reimbursement";

			const response = await fetch(url, {
				method: editMode ? "PUT" : "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to save");
			}

			onSuccess();
		} catch (error: any) {
			toast.error(error.message || "Gagal menyimpan data");
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	// Format currency input
	const handleCurrencyChange = (value: string) => {
		// Remove non-numeric characters
		const numeric = value.replace(/[^0-9]/g, "");
		setFormData({ ...formData, nilai_kwitansi: numeric });
	};

	const formatCurrencyDisplay = (value: string) => {
		if (!value) return "";
		return new Intl.NumberFormat("id-ID").format(parseInt(value));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editMode ? "Edit Reimbursement" : "Tambah Reimbursement"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* No Validasi PPK */}
					<div>
						<Label htmlFor="no_validasi_ppk">
							No Validasi PPK <span className="text-red-500">*</span>
						</Label>
						<Input
							id="no_validasi_ppk"
							value={formData.no_validasi_ppk}
							onChange={(e) =>
								setFormData({ ...formData, no_validasi_ppk: e.target.value })
							}
							required
						/>
					</div>

					{/* Tanggal Validasi PPK */}
					<div>
						<Label htmlFor="tgl_validasi_ppk">
							Tanggal Validasi PPK <span className="text-red-500">*</span>
						</Label>
						<Input
							id="tgl_validasi_ppk"
							type="date"
							value={formData.tgl_validasi_ppk}
							onChange={(e) =>
								setFormData({ ...formData, tgl_validasi_ppk: e.target.value })
							}
							required
						/>
					</div>

					{/* Vendor */}
					<div>
						<Label htmlFor="vendor_id">
							Nama Penyedia <span className="text-red-500">*</span>
						</Label>
						<Select
							value={formData.vendor_id}
							onValueChange={(value) =>
								setFormData({ ...formData, vendor_id: value })
							}
							required
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih penyedia" />
							</SelectTrigger>
							<SelectContent>
								{vendors.map((vendor) => (
									<SelectItem key={vendor.id} value={vendor.id}>
										{vendor.vendor_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Nomor Kwitansi */}
					<div>
						<Label htmlFor="nomor_kwitansi">
							Nomor Kwitansi <span className="text-red-500">*</span>
						</Label>
						<Input
							id="nomor_kwitansi"
							value={formData.nomor_kwitansi}
							onChange={(e) =>
								setFormData({ ...formData, nomor_kwitansi: e.target.value })
							}
							required
						/>
					</div>

					{/* Tanggal Kwitansi */}
					<div>
						<Label htmlFor="tanggal_kwitansi">
							Tanggal Kwitansi <span className="text-red-500">*</span>
						</Label>
						<Input
							id="tanggal_kwitansi"
							type="date"
							value={formData.tanggal_kwitansi}
							onChange={(e) =>
								setFormData({ ...formData, tanggal_kwitansi: e.target.value })
							}
							required
						/>
					</div>

					{/* Uraian Pekerjaan */}
					<div>
						<Label htmlFor="uraian_pekerjaan">
							Uraian Pekerjaan <span className="text-red-500">*</span>
						</Label>
						<Textarea
							id="uraian_pekerjaan"
							value={formData.uraian_pekerjaan}
							onChange={(e) =>
								setFormData({ ...formData, uraian_pekerjaan: e.target.value })
							}
							rows={3}
							required
						/>
					</div>

					{/* Nilai Kwitansi */}
					<div>
						<Label htmlFor="nilai_kwitansi">
							Nilai Kwitansi <span className="text-red-500">*</span>
						</Label>
						<div className="relative">
							<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
								Rp
							</span>
							<Input
								id="nilai_kwitansi"
								value={formatCurrencyDisplay(formData.nilai_kwitansi)}
								onChange={(e) => handleCurrencyChange(e.target.value)}
								className="pl-9"
								placeholder="0"
								required
							/>
						</div>
					</div>

					{/* Status */}
					<div>
						<Label htmlFor="status_id">
							Status <span className="text-red-500">*</span>
						</Label>
						<Select
							value={formData.status_id}
							onValueChange={(value) =>
								setFormData({ ...formData, status_id: value })
							}
							required
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih status" />
							</SelectTrigger>
							<SelectContent>
								{statuses.map((status) => (
									<SelectItem key={status.id} value={status.id}>
										{status.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Keterangan */}
					<div>
						<Label htmlFor="keterangan">Keterangan</Label>
						<Textarea
							id="keterangan"
							value={formData.keterangan}
							onChange={(e) =>
								setFormData({ ...formData, keterangan: e.target.value })
							}
							rows={2}
							placeholder="Opsional"
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={loading}
						>
							Batal
						</Button>
						<Button type="submit" disabled={loading}>
							{loading ? "Menyimpan..." : "Simpan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
