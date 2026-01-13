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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface BankAccountFormData {
	account_number: string;
	account_name?: string;
	bank_name?: string;
	branch_name?: string;
	currency_code?: string;
	is_primary: boolean;
}

interface BankAccountFormDialogProps {
	vendorId: string;
	accountId?: string;
	initialData?: BankAccountFormData;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export function BankAccountFormDialog({
	vendorId,
	accountId,
	initialData,
	open,
	onOpenChange,
	onSuccess,
}: BankAccountFormDialogProps) {
	const [isLoading, setIsLoading] = useState(false);
	const isEdit = !!accountId;

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<BankAccountFormData>({
		defaultValues: initialData || {
			account_number: "",
			account_name: "",
			bank_name: "",
			branch_name: "",
			currency_code: "IDR",
			is_primary: false,
		},
	});

	const isPrimary = watch("is_primary");

	useEffect(() => {
		if (open && initialData) {
			reset(initialData);
		} else if (open && !initialData) {
			reset({
				account_number: "",
				account_name: "",
				bank_name: "",
				branch_name: "",
				currency_code: "IDR",
				is_primary: false,
			});
		}
	}, [open, initialData, reset]);

	const onSubmit = async (data: BankAccountFormData) => {
		setIsLoading(true);

		try {
			const url = isEdit
				? `/api/vendors/${vendorId}/bank-accounts/${accountId}`
				: `/api/vendors/${vendorId}/bank-accounts`;
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
				throw new Error(result.error || "Failed to save bank account");
			}

			toast.success(
				isEdit
					? "Bank account updated successfully"
					: "Bank account added successfully"
			);
			onOpenChange(false);
			onSuccess();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save bank account"
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
						{isEdit ? "Edit Rekening Bank" : "Tambah Rekening Bank"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					{/* Account Number */}
					<div className="space-y-2">
						<Label htmlFor="account_number">
							Nomor Rekening <span className="text-red-500">*</span>
						</Label>
						<Input
							id="account_number"
							placeholder="1234567890"
							{...register("account_number", {
								required: "Nomor rekening wajib diisi",
							})}
						/>
						{errors.account_number && (
							<p className="text-sm text-red-500">
								{errors.account_number.message}
							</p>
						)}
					</div>

					{/* Account Name */}
					<div className="space-y-2">
						<Label htmlFor="account_name">Nama Rekening</Label>
						<Input
							id="account_name"
							placeholder="PT Maju Jaya Konstruksi"
							{...register("account_name")}
						/>
					</div>

					{/* Bank Name */}
					<div className="space-y-2">
						<Label htmlFor="bank_name">Nama Bank</Label>
						<Input
							id="bank_name"
							placeholder="Bank Mandiri"
							{...register("bank_name")}
						/>
					</div>

					{/* Branch Name */}
					<div className="space-y-2">
						<Label htmlFor="branch_name">Nama Cabang</Label>
						<Input
							id="branch_name"
							placeholder="KC Daan Mogot"
							{...register("branch_name")}
						/>
					</div>

					{/* Currency Code */}
					<div className="space-y-2">
						<Label htmlFor="currency_code">Kode Mata Uang</Label>
						<Input
							id="currency_code"
							placeholder="IDR"
							{...register("currency_code")}
						/>
						<p className="text-xs text-muted-foreground">
							Default: IDR (Rupiah Indonesia)
						</p>
					</div>

					{/* Is Primary */}
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<Label htmlFor="is_primary">Rekening Utama</Label>
							<p className="text-sm text-muted-foreground">
								Rekening ini akan digunakan untuk pembayaran default
							</p>
						</div>
						<Switch
							id="is_primary"
							checked={isPrimary}
							onCheckedChange={(checked) => setValue("is_primary", checked)}
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
