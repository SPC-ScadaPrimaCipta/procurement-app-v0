"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { FileStack } from "lucide-react";

export interface DispositionData {
	agenda_scope: string;
	agenda_number: string;
	disposition_date: string;
	disposition_actions: string[];
	forward_to_ids: string[];
	disposition_note: string;
}

interface DispositionSectionProps {
	data: DispositionData;
	onChange: (data: DispositionData) => void;
}

export function DispositionSection({
	data,
	onChange,
}: DispositionSectionProps) {
	const [masterActions, setMasterActions] = useState<any[]>([]);
	const [masterRecipients, setMasterRecipients] = useState<any[]>([]);

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
		fetchMasters();
	}, []);

	const handleChange = (field: keyof DispositionData, value: any) => {
		onChange({ ...data, [field]: value });
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<FileStack className="h-5 w-5 text-primary" />
					<CardTitle>Lembar Disposisi</CardTitle>
				</div>
				<CardDescription>
					Lengkapi data disposisi berikut ini.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Scope & Date & Number */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="space-y-2">
						<Label>Scope Disposisi</Label>
						<Select
							value={data.agenda_scope}
							onValueChange={(value) =>
								handleChange("agenda_scope", value)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Pilih Scope" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Biro">Biro</SelectItem>
								<SelectItem value="Bagian">Bagian</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="agenda_number">
							No. Agenda Disposisi
						</Label>
						<Input
							id="agenda_number"
							value={data.agenda_number}
							onChange={(e) =>
								handleChange("agenda_number", e.target.value)
							}
							placeholder="Contoh: 123/A/2024"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="disposition_date">
							Tanggal Disposisi
						</Label>
						<Input
							type="date"
							id="disposition_date"
							value={data.disposition_date}
							onChange={(e) =>
								handleChange("disposition_date", e.target.value)
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
									id={`recipient-${recipient.id}`}
									checked={data.forward_to_ids.includes(
										recipient.id
									)}
									onCheckedChange={(checked) => {
										const newIds = checked
											? [
													...data.forward_to_ids,
													recipient.id,
											  ]
											: data.forward_to_ids.filter(
													(id) => id !== recipient.id
											  );
										handleChange("forward_to_ids", newIds);
									}}
								/>
								<Label
									htmlFor={`recipient-${recipient.id}`}
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
									id={`action-${action.id}`}
									checked={data.disposition_actions.includes(
										action.name
									)}
									onCheckedChange={(checked) => {
										const newActions = checked
											? [
													...data.disposition_actions,
													action.name,
											  ]
											: data.disposition_actions.filter(
													(a) => a !== action.name
											  );
										handleChange(
											"disposition_actions",
											newActions
										);
									}}
								/>
								<Label
									htmlFor={`action-${action.id}`}
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
					<Label htmlFor="disposition_note">Catatan Tambahan</Label>
					<Textarea
						id="disposition_note"
						placeholder="Tulis catatan disposisi di sini..."
						value={data.disposition_note}
						onChange={(e) =>
							handleChange("disposition_note", e.target.value)
						}
						className="min-h-[100px]"
					/>
				</div>
			</CardContent>
		</Card>
	);
}
