"use client";

import { useEffect, useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DispositionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	caseId: string;
	initialData?: any;
	onSuccess?: () => void;
}

export function DispositionModal({
	open,
	onOpenChange,
	caseId,
	initialData,
	onSuccess,
}: DispositionModalProps) {
	const [loading, setLoading] = useState(false);
	const [masterActions, setMasterActions] = useState<any[]>([]);
	const [masterRecipients, setMasterRecipients] = useState<any[]>([]);

	const [form, setForm] = useState({
		agenda_scope: "Biro",
		agenda_number: "",
		disposition_date: new Date().toISOString().split("T")[0],
		disposition_actions: [] as string[],
		forward_to_ids: [] as string[],
		disposition_note: "",
	});

	useEffect(() => {
		const fetchMasters = async () => {
			try {
				const [actionsRes, recipientsRes] = await Promise.all([
					fetch("/api/master/disposition-action"),
					fetch("/api/master/disposition-recipient"),
				]);
				if (actionsRes.ok) setMasterActions(await actionsRes.json());
				if (recipientsRes.ok)
					setMasterRecipients(await recipientsRes.json());
			} catch (e) {
				console.error("Failed to load master data", e);
			}
		};
		if (open) {
			fetchMasters();
		}
	}, [open]);

	useEffect(() => {
		if (initialData) {
			const actions: string[] = Array.isArray(
				initialData.disposition_actions
			)
				? initialData.disposition_actions
				: [];

			let forwardIds: string[] = [];
			if (initialData.forward_to) {
				forwardIds = initialData.forward_to.map(
					(item: any) => item.recipient.id
				);
			}

			setForm({
				agenda_scope: initialData.agenda_scope || "Biro",
				agenda_number: initialData.agenda_number || "",
				disposition_date: initialData.disposition_date
					? new Date(initialData.disposition_date)
							.toISOString()
							.split("T")[0]
					: new Date().toISOString().split("T")[0],
				disposition_actions: actions,
				forward_to_ids: forwardIds,
				disposition_note: initialData.disposition_note || "",
			});
		}
	}, [initialData, open]);

	const handleSave = async () => {
		if (!form.agenda_number) {
			toast.error("Nomor Agenda Disposisi wajib diisi");
			return;
		}

		try {
			setLoading(true);
			const res = await fetch(
				`/api/procurement-cases/${caseId}/disposition`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(form),
				}
			);

			if (!res.ok) throw new Error("Gagal menyimpan disposisi");

			toast.success("Disposisi berhasil disimpan");
			if (onSuccess) onSuccess();
			onOpenChange(false);
		} catch (e: any) {
			toast.error(e.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="w-full sm:max-w-[50vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Lembar Disposisi</DialogTitle>
					<DialogDescription>
						Lengkapi data disposisi berikut ini.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-6 py-4">
					{/* Scope & Date & Number */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="space-y-2">
							<Label>Scope Disposisi</Label>
							<Select
								value={form.agenda_scope}
								onValueChange={(value) =>
									setForm({
										...form,
										agenda_scope: value,
									})
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Pilih Scope" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Biro">Biro</SelectItem>
									<SelectItem value="Bagian">
										Bagian
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="modal-agenda_number">
								No. Agenda Disposisi
							</Label>
							<Input
								id="modal-agenda_number"
								value={form.agenda_number}
								onChange={(e) =>
									setForm({
										...form,
										agenda_number: e.target.value,
									})
								}
								placeholder="Contoh: 123/A/2024"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="modal-disposition_date">
								Tanggal Disposisi
							</Label>
							<Input
								type="date"
								id="modal-disposition_date"
								value={form.disposition_date}
								onChange={(e) =>
									setForm({
										...form,
										disposition_date: e.target.value,
									})
								}
							/>
						</div>
					</div>

					<Separator />

					{/* Recipients */}
					<div className="space-y-3">
						<Label className="text-base font-semibold">
							Diteruskan Kepada
						</Label>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{masterRecipients.map((recipient) => (
								<div
									key={recipient.id}
									className="flex items-start space-x-2"
								>
									<Checkbox
										id={`modal-recipient-${recipient.id}`}
										checked={form.forward_to_ids.includes(
											recipient.id
										)}
										onCheckedChange={(checked) => {
											const newIds = checked
												? [
														...form.forward_to_ids,
														recipient.id,
												  ]
												: form.forward_to_ids.filter(
														(id) =>
															id !== recipient.id
												  );
											setForm({
												...form,
												forward_to_ids: newIds,
											});
										}}
									/>
									<Label
										htmlFor={`modal-recipient-${recipient.id}`}
										className="font-normal leading-tight cursor-pointer"
									>
										{recipient.name}
									</Label>
								</div>
							))}
						</div>
					</div>

					<Separator />

					{/* Disposition Actions */}
					<div className="space-y-3">
						<Label className="text-base font-semibold">
							Instruksi / Disposisi
						</Label>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							{masterActions.map((action) => (
								<div
									key={action.id}
									className="flex items-start space-x-2"
								>
									<Checkbox
										id={`modal-action-${action.id}`}
										checked={form.disposition_actions.includes(
											action.name
										)}
										onCheckedChange={(checked) => {
											const newActions = checked
												? [
														...form.disposition_actions,
														action.name,
												  ]
												: form.disposition_actions.filter(
														(a) => a !== action.name
												  );
											setForm({
												...form,
												disposition_actions: newActions,
											});
										}}
									/>
									<Label
										htmlFor={`modal-action-${action.id}`}
										className="font-normal leading-tight cursor-pointer"
									>
										{action.name}
									</Label>
								</div>
							))}
						</div>
					</div>
					<Separator />

					{/* Note */}
					<div className="space-y-2">
						<Label htmlFor="modal-disposition_note">
							Catatan Tambahan
						</Label>
						<Textarea
							id="modal-disposition_note"
							placeholder="Tulis catatan disposisi di sini..."
							value={form.disposition_note}
							onChange={(e) =>
								setForm({
									...form,
									disposition_note: e.target.value,
								})
							}
							className="min-h-[100px]"
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Batal
					</Button>
					<Button onClick={handleSave} disabled={loading}>
						{loading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Simpan Disposisi
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
