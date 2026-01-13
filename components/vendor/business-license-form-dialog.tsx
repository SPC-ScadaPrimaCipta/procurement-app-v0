"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { toast } from "sonner";

interface BusinessLicenseFormData {
	license_type: string;
	license_number: string;
	qualification?: string;
	issued_date?: string;
	expiry_date?: string;
}

interface BusinessLicenseFormDialogProps {
	vendorId: string;
	licenseId?: string;
	initialData?: BusinessLicenseFormData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function BusinessLicenseFormDialog({
	vendorId,
	licenseId,
	initialData,
	open,
	onOpenChange,
	onSuccess,
}: BusinessLicenseFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const isEdit = !!licenseId;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<BusinessLicenseFormData>({
		defaultValues: initialData || {
			license_type: "",
			license_number: "",
			qualification: "",
			issued_date: "",
			expiry_date: "",
		},
	});

	useEffect(() => {
		if (open && initialData) {
			reset(initialData);
		} else if (open && !initialData) {
			reset({
				license_type: "",
				license_number: "",
				qualification: "",
				issued_date: "",
				expiry_date: "",
			});
		}
	}, [open, initialData, reset]);

	const onSubmit = async (data: BusinessLicenseFormData) => {
		setIsLoading(true);

		try {
			const url = isEdit
				? `/api/vendors/${vendorId}/business-licenses/${licenseId}`
				: `/api/vendors/${vendorId}/business-licenses`;
			const method = isEdit ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to save business license");
			}

			toast.success(
				isEdit
					? "Business license updated successfully"
					: "Business license added successfully"
			);
			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save business license"
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Edit Izin Usaha" : "Tambah Izin Usaha"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* License Type */}
					<div className="space-y-2">
						<Label htmlFor="license_type">
							Jenis Izin <span className="text-red-500">*</span>
						</Label>
						<Input
							id="license_type"
							placeholder="SIUP, TDP, NIB, dll"
							{...register("license_type", {
								required: "Jenis izin wajib diisi",
							})}
						/>
						{errors.license_type && (
							<p className="text-sm text-red-500">
								{errors.license_type.message}
							</p>
						)}
					</div>

					{/* License Number */}
					<div className="space-y-2">
						<Label htmlFor="license_number">
							Nomor Izin <span className="text-red-500">*</span>
						</Label>
						<Input
							id="license_number"
							placeholder="123456789"
							{...register("license_number", {
								required: "Nomor izin wajib diisi",
							})}
						/>
						{errors.license_number && (
							<p className="text-sm text-red-500">
								{errors.license_number.message}
							</p>
						)}
					</div>

					{/* Qualification */}
					<div className="space-y-2">
						<Label htmlFor="qualification">Kualifikasi</Label>
						<Input
							id="qualification"
							placeholder="Kecil, Menengah, Besar"
							{...register("qualification")}
						/>
					</div>

					{/* Issue Date */}
					<div className="space-y-2">
						<Label htmlFor="issued_date">Tanggal Terbit</Label>
						<Input
							id="issued_date"
							type="date"
							{...register("issued_date")}
						/>
					</div>

					{/* Expiry Date */}
					<div className="space-y-2">
						<Label htmlFor="expiry_date">Tanggal Kadaluarsa</Label>
						<Input
							id="expiry_date"
							type="date"
							{...register("expiry_date")}
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
							{isLoading ? "Menyimpan..." : "Simpan"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
