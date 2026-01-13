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

interface ManagementFormData {
	full_name: string;
	position_title?: string;
	phone?: string;
	email?: string;
}

interface ManagementFormDialogProps {
	vendorId: string;
	managementId?: string;
	initialData?: ManagementFormData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function ManagementFormDialog({
	vendorId,
	managementId,
	initialData,
	open,
	onOpenChange,
	onSuccess,
}: ManagementFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const isEdit = !!managementId;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors },
	} = useForm<ManagementFormData>({
		defaultValues: initialData || {
			full_name: "",
			position_title: "",
			phone: "",
			email: "",
		},
	});

	useEffect(() => {
		if (open && initialData) {
			reset(initialData);
		} else if (open && !initialData) {
			reset({
				full_name: "",
				position_title: "",
				phone: "",
				email: "",
			});
		}
	}, [open, initialData, reset]);

	const onSubmit = async (data: ManagementFormData) => {
		setIsLoading(true);

		try {
			const url = isEdit
				? `/api/vendors/${vendorId}/management/${managementId}`
				: `/api/vendors/${vendorId}/management`;
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
				throw new Error(result.error || "Failed to save management");
			}

			toast.success(
				isEdit
					? "Management updated successfully"
					: "Management added successfully"
			);
			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save management"
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
						{isEdit ? "Edit Manajerial" : "Tambah Manajerial"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* Full Name */}
					<div className="space-y-2">
						<Label htmlFor="full_name">
							Nama Lengkap <span className="text-red-500">*</span>
						</Label>
						<Input
							id="full_name"
							placeholder="John Doe"
							{...register("full_name", {
								required: "Nama lengkap wajib diisi",
							})}
						/>
						{errors.full_name && (
							<p className="text-sm text-red-500">
								{errors.full_name.message}
							</p>
						)}
					</div>

					{/* Position Title */}
					<div className="space-y-2">
						<Label htmlFor="position_title">Jabatan</Label>
						<Input
							id="position_title"
							placeholder="Direktur Utama"
							{...register("position_title")}
						/>
					</div>

					{/* Phone */}
					<div className="space-y-2">
						<Label htmlFor="phone">Telepon</Label>
						<Input
							id="phone"
							placeholder="08123456789"
							{...register("phone")}
						/>
					</div>

					{/* Email */}
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="john@example.com"
							{...register("email")}
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
