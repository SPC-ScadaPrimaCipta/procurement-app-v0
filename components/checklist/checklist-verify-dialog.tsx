import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ChecklistVerifyDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	requirementId: string;
	caseId: string;
	onSuccess: () => void;
}

export function ChecklistVerifyDialog({
	open,
	onOpenChange,
	title,
	requirementId,
	caseId,
	onSuccess,
}: ChecklistVerifyDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors },
	} = useForm<{
		status: "PASS" | "FAIL";
		notes: string;
	}>({
		defaultValues: {
			status: "PASS",
		},
	});

	const status = watch("status");

	const onSubmit = async (data: {
		status: "PASS" | "FAIL";
		notes: string;
	}) => {
		try {
			setIsSubmitting(true);
			const res = await fetch(
				`/api/procurement-cases/${caseId}/checklist/manual`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						requirementId,
						status: data.status,
						notes: data.notes,
					}),
				}
			);

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || "Verification failed");
			}

			toast.success("Verifikasi berhasil disimpan");
			onSuccess();
			onOpenChange(false);
			reset();
		} catch (error: any) {
			console.error(error);
			toast.error(error.message || "Gagal menyimpan verifikasi");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Verifikasi Manual</DialogTitle>
					<DialogDescription>
						Verifikasi persyaratan: <b>{title}</b>
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-3">
						<Label>Status</Label>
						<div className="flex gap-4">
							<div
								className={`
                                flex items-center justify-center space-x-2 border p-3 rounded-md cursor-pointer transition-colors w-full 
                                ${
									status === "PASS"
										? "bg-green-600 border-green-600 text-white"
										: "border-input hover:bg-muted text-muted-foreground"
								}
                            `}
								onClick={() => setValue("status", "PASS")}
							>
								<CheckCircle2
									className={`w-5 h-5 ${
										status === "PASS"
											? "text-white"
											: "text-green-600/70"
									}`}
								/>
								<span className="font-medium">Sudah</span>
							</div>

							<div
								className={`
                                flex items-center justify-center space-x-2 border p-3 rounded-md cursor-pointer transition-colors w-full
                                ${
									status === "FAIL"
										? "bg-red-600 border-red-600 text-white"
										: "border-input hover:bg-muted text-muted-foreground"
								}
                            `}
								onClick={() => setValue("status", "FAIL")}
							>
								<XCircle
									className={`w-5 h-5 ${
										status === "FAIL"
											? "text-white"
											: "text-red-600/70"
									}`}
								/>
								<span className="font-medium">Belum</span>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">
							Catatan{" "}
							{status === "FAIL" && (
								<span className="text-red-500">*</span>
							)}
						</Label>
						<Textarea
							id="notes"
							placeholder="Tambahkan catatan verifikasi..."
							disabled={isSubmitting}
							{...register("notes", {
								required:
									status === "FAIL"
										? "Catatan wajib diisi jika gagal"
										: false,
							})}
						/>
						{errors.notes && (
							<p className="text-xs text-red-500">
								{errors.notes.message}
							</p>
						)}
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isSubmitting}
						>
							Batal
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Menyimpan...
								</>
							) : (
								"Simpan Verifikasi"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
