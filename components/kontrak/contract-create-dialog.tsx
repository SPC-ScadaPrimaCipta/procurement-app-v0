"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import {
	CalendarIcon,
	Loader2,
	Plus,
	Trash,
	FileText,
	Upload,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// --- Schema Definitions ---

const contractSchema = z.object({
	contract_number: z.string().min(1, "Required"),
	contract_date: z.date(),
	vendor_id: z.string().min(1, "Required"),
	work_description: z.string().min(1, "Required"),
	contract_value: z.number().min(0, "Must be positive"),
	start_date: z.date(),
	end_date: z.date(),
	duration_days: z.number().optional(), // Processed calculated
	procurement_method_id: z.string().min(1, "Required"),
	contract_status_id: z.string().min(1, "Required"),
	expense_type: z.enum(["BELANJA_BARANG", "BELANJA_MODAL"]),
	procurement_type_id: z.string().min(1, "Required"),
	// Nested fields for UI only initially
	payment_plan: z.array(z.any()).optional(),
	bast: z.array(z.any()).optional(),
	documents: z.array(z.any()).optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

import { ContractPaymentPlan } from "@/components/kontrak/contract-payment-plan";
import { VendorSelect } from "@/components/kontrak/vendor-select";
import { VendorInfoCard } from "@/components/kontrak/vendor-info-card";
import { ContractUploadDialog } from "@/components/kontrak/contract-upload-dialog";
import { toast } from "sonner";

interface ContractCreateDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	caseId: string;
	onSuccess: () => void;
}

export function ContractCreateDialog({
	open,
	onOpenChange,
	caseId,
	onSuccess,
}: ContractCreateDialogProps) {
	const [loading, setLoading] = useState(false);
	const [procurementMethods, setProcurementMethods] = useState<
		{ id: string; name: string }[]
	>([]);
	const [procurementTypes, setProcurementTypes] = useState<
		{ id: string; name: string }[]
	>([]);
	const [contractStatuses, setContractStatuses] = useState<
		{ id: string; name: string }[]
	>([]);

	const [pendingDocuments, setPendingDocuments] = useState<
		{ file: File; docTypeId: string; docTypeName: string }[]
	>([]);
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [masterDocTypes, setMasterDocTypes] = useState<
		{ id: string; name: string }[]
	>([]);

	const form = useForm<ContractFormValues>({
		resolver: zodResolver(contractSchema),
		defaultValues: {
			contract_number: "",
			work_description: "",
			contract_value: 0,
			expense_type: "BELANJA_BARANG",
			payment_plan: [],
		},
	});

	useEffect(() => {
		if (open) {
			const fetchMasterData = async () => {
				try {
					const [resMethods, resStatuses, resDocTypes] =
						await Promise.all([
							fetch("/api/master/procurement-method").then((r) =>
								r.ok ? r.json() : [],
							),
							fetch("/api/master/contract-status").then((r) =>
								r.ok ? r.json() : [],
							),
							fetch("/api/master/doc-type").then((r) =>
								r.ok ? r.json() : [],
							),
						]);

					setProcurementMethods(resMethods || []);
					setContractStatuses(resStatuses || []);
					setMasterDocTypes(resDocTypes || []);
				} catch (error) {
					console.error("Failed to fetch master data", error);
				}
			};
			fetchMasterData();
		} else {
			// Reset form and state when closed
			form.reset();
			setPendingDocuments([]);
		}
	}, [open, form]);

	useEffect(() => {
		if (open) {
			const fetchProcurementTypes = async () => {
				try {
					const res = await fetch("/api/master/procurement-type");
					if (res.ok) {
						const data = await res.json();
						setProcurementTypes(data || []);
					}
				} catch (error) {
					console.error("Failed to fetch procurement types", error);
				}
			};
			fetchProcurementTypes();
		}
	}, [open]);

	// Auto-calculate duration
	const startDate = form.watch("start_date");
	const endDate = form.watch("end_date");
	const duration =
		startDate && endDate
			? differenceInDays(endDate, startDate) + 1 // Inclusive
			: 0;

	const onSubmit = async (values: ContractFormValues) => {
		try {
			setLoading(true);

			// 1. Create Contract
			const contractPayload = {
				...values,
				procurement_case_id: caseId,
				// Ensure dates are valid strings/dates for JSON
				contract_date: values.contract_date,
				start_date: values.start_date,
				end_date: values.end_date,
				// Remove ui-only fields
				payment_plan: undefined,
				bast: undefined,
				documents: undefined,
			};

			// 2. Upload Pending Documents
			const uploadedDocsMetadata = [];
			if (pendingDocuments.length > 0) {
				for (const doc of pendingDocuments) {
					const formData = new FormData();
					formData.append("file", doc.file);
					// We don't have contract ID yet, so we omit ref_id to skip DB creation
					// The DB record will be created by the create-contract API
					// We just want the file uploaded to SharePoint and get the URL
					formData.append("folder_path", "Contracts/Uploads"); // Generic path or could be parameterized
					formData.append("ref_type", "PROCUREMENT_CASE");
					formData.append("ref_id", caseId);
					formData.append("doc_type_id", doc.docTypeId);

					const uploadRes = await fetch("/api/uploads", {
						method: "POST",
						body: formData,
					});

					if (!uploadRes.ok) {
						throw new Error(`Failed to upload ${doc.file.name}`);
					}

					const uploadResult = await uploadRes.json();
					const uploadedFile = uploadResult[0]; // Assuming single file upload per request

					if (uploadedFile) {
						uploadedDocsMetadata.push({
							title: doc.file.name,
							file_name: uploadedFile.name,
							file_url: uploadedFile.url,
							doc_type_id: doc.docTypeId,
							file_size: uploadedFile.size,
							// mime_type: doc.file.type // Added if needed
						});
					}
				}
			}

			// Add uploaded docs to payload
			// @ts-ignore
			contractPayload.documents = uploadedDocsMetadata;

			const contractRes = await fetch("/api/contracts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(contractPayload),
			});

			if (!contractRes.ok) {
				throw new Error("Failed to create contract");
			}

			const newContract = await contractRes.json();

			// 2. Save Payment Plan if exists
			if (values.payment_plan && values.payment_plan.length > 0) {
				const planRes = await fetch(
					`/api/contracts/${newContract.id}/payment-plans`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(values.payment_plan),
					},
				);
				if (!planRes.ok) {
					console.error("Failed to save payment plan");
					toast.error("Gagal menyimpan rencana pembayaran");
				}
			}

			onSuccess();
			onOpenChange(false);
		} catch (error) {
			console.error(error);
			toast.error(`Gagal membuat kontrak: ${error}`);
		} finally {
			setLoading(false);
		}
	};

	const handleAddDocument = (
		file: File,
		docTypeId: string,
		docTypeName: string,
	) => {
		setPendingDocuments((prev) => [
			...prev,
			{ file, docTypeId, docTypeName },
		]);
		setUploadDialogOpen(false);
	};

	const handleRemoveDocument = (index: number) => {
		setPendingDocuments((prev) => prev.filter((_, i) => i !== index));
	};

	const onInvalid = (errors: any) => {
		console.error("Form validation errors:", errors);
		const errorMessages = Object.entries(errors)
			.map(([key, error]: [string, any]) => `${key}: ${error.message}`)
			.join("\n");
		toast.error(
			"Gagal menyimpan kontrak. Mohon periksa kembali inputan anda.",
			{
				description: errorMessages,
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[50vw] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Buat Kontrak Baru</DialogTitle>
					<DialogDescription>
						Lengkapi formulir di bawah ini untuk membuat kontrak
						baru.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit, onInvalid)}
						className="space-y-6"
					>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Left Column */}
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="contract_number"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nomor Kontrak</FormLabel>
											<FormControl>
												<Input
													placeholder="Contoh: 001/KONTRAK/2024"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="contract_date"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel>
												Tanggal Kontrak
											</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={"outline"}
															className={cn(
																"w-full pl-3 text-left font-normal",
																!field.value &&
																	"text-muted-foreground",
															)}
														>
															{field.value ? (
																format(
																	field.value,
																	"PPP",
																)
															) : (
																<span>
																	Pick a date
																</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
														</Button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent
													className="w-auto p-0"
													align="start"
												>
													<Calendar
														mode="single"
														selected={field.value}
														onSelect={
															field.onChange
														}
														disabled={(date) =>
															date > new Date() ||
															date <
																new Date(
																	"1900-01-01",
																)
														}
														initialFocus
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="vendor_id"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Vendor</FormLabel>
											<FormControl>
												<VendorSelect
													value={field.value}
													onChange={field.onChange}
													placeholder="Pilih Vendor"
													multiple={false}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Vendor Info Card - Auto Display */}
								<VendorInfoCard
									vendorId={form.watch("vendor_id")}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="expense_type"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Jenis Belanja
												</FormLabel>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full [&>span]:line-clamp-1 [&>span]:truncate">
															<SelectValue placeholder="Pilih..." />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														<SelectItem value="BELANJA_BARANG">
															Belanja Barang
														</SelectItem>
														<SelectItem value="BELANJA_MODAL">
															Belanja Modal
														</SelectItem>
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="procurement_type_id"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Jenis Pengadaan
												</FormLabel>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full [&>span]:line-clamp-1 [&>span]:truncate">
															<SelectValue placeholder="Pilih..." />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{procurementTypes.map(
															(t) => (
																<SelectItem
																	key={t.id}
																	value={t.id}
																>
																	{t.name}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="procurement_method_id"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Metode Pengadaan
												</FormLabel>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full [&>span]:line-clamp-1 [&>span]:truncate">
															<SelectValue placeholder="Pilih Metode" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{procurementMethods.map(
															(m) => (
																<SelectItem
																	key={m.id}
																	value={m.id}
																>
																	{m.name}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="contract_status_id"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Status Kontrak
												</FormLabel>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<FormControl>
														<SelectTrigger className="w-full [&>span]:line-clamp-1 [&>span]:truncate">
															<SelectValue placeholder="Pilih Status" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{contractStatuses.map(
															(s) => (
																<SelectItem
																	key={s.id}
																	value={s.id}
																>
																	{s.name}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							{/* Right Column */}
							<div className="space-y-4">
								<FormField
									control={form.control}
									name="work_description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Uraian Pekerjaan
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Deskripsi pekerjaan..."
													className="resize-none min-h-[120px]"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="contract_value"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Nilai Kontrak</FormLabel>
											<FormControl>
												<div className="relative">
													<span className="absolute left-3 top-2.5 text-sm text-muted-foreground">
														Rp
													</span>
													<Input
														type="number"
														className="pl-9"
														placeholder="0"
														{...field}
														onChange={(e) =>
															field.onChange(
																e.target
																	.valueAsNumber,
															)
														}
													/>
												</div>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="grid grid-cols-2 gap-4">
									<FormField
										control={form.control}
										name="start_date"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>
													Tanggal Mulai
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant={
																	"outline"
																}
																className={cn(
																	"w-full pl-3 text-left font-normal",
																	!field.value &&
																		"text-muted-foreground",
																)}
															>
																{field.value ? (
																	format(
																		field.value,
																		"PPP",
																	)
																) : (
																	<span>
																		Pick a
																		date
																	</span>
																)}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className="w-auto p-0"
														align="start"
													>
														<Calendar
															mode="single"
															selected={
																field.value
															}
															onSelect={
																field.onChange
															}
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="end_date"
										render={({ field }) => (
											<FormItem className="flex flex-col">
												<FormLabel>
													Tanggal Selesai
												</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant={
																	"outline"
																}
																className={cn(
																	"w-full pl-3 text-left font-normal",
																	!field.value &&
																		"text-muted-foreground",
																)}
															>
																{field.value ? (
																	format(
																		field.value,
																		"PPP",
																	)
																) : (
																	<span>
																		Pick a
																		date
																	</span>
																)}
																<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className="w-auto p-0"
														align="start"
													>
														<Calendar
															mode="single"
															selected={
																field.value
															}
															onSelect={
																field.onChange
															}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="p-4 bg-muted/20 rounded-lg flex justify-between items-center border">
									<span className="text-sm font-medium">
										Durasi Pekerjaan
									</span>
									<span className="font-mono font-bold">
										{duration > 0 ? duration : 0} Hari
									</span>
								</div>
							</div>
						</div>

						<Separator />

						{/* Sub-sections (Placeholder UI) */}
						<div className="space-y-6">
							{/* Payment Plan */}
							<FormField
								control={form.control}
								name="payment_plan"
								render={({ field }) => (
									<ContractPaymentPlan
										value={field.value}
										onChange={field.onChange}
									/>
								)}
							/>

							{/* Documents */}
							<Card className="border-dashed shadow-none">
								<CardHeader className="px-4 border-b bg-muted/20">
									<div className="flex items-center justify-between">
										<CardTitle className="text-sm font-medium">
											Dokumen Lampiran (
											{pendingDocuments.length})
										</CardTitle>
										<Button
											size="sm"
											variant="outline"
											type="button"
											onClick={() =>
												setUploadDialogOpen(true)
											}
										>
											<Plus className="w-3 h-3 mr-1" />{" "}
											Upload
										</Button>
									</div>
								</CardHeader>
								<CardContent className="p-0">
									{pendingDocuments.length === 0 ? (
										<p className="text-xs text-muted-foreground text-center py-8">
											Belum ada dokumen dilampirkan.
										</p>
									) : (
										<div className="divide-y">
											{pendingDocuments.map(
												(doc, index) => (
													<div
														key={index}
														className="flex items-center justify-between p-3"
													>
														<div className="flex items-center gap-3 overflow-hidden">
															<div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
																<FileText className="w-4 h-4" />
															</div>
															<div className="min-w-0">
																<p className="text-sm font-medium truncate">
																	{
																		doc.file
																			.name
																	}
																</p>
																<p className="text-xs text-muted-foreground">
																	{
																		doc.docTypeName
																	}{" "}
																	•{" "}
																	{(
																		doc.file
																			.size /
																		1024
																	).toFixed(
																		0,
																	)}{" "}
																	KB
																</p>
															</div>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="text-red-500 hover:text-red-600 hover:bg-red-50"
															onClick={() =>
																handleRemoveDocument(
																	index,
																)
															}
														>
															<Trash className="w-4 h-4" />
														</Button>
													</div>
												),
											)}
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						<ContractUploadDialog
							open={uploadDialogOpen}
							onOpenChange={setUploadDialogOpen}
							docTypes={masterDocTypes}
							onUpload={handleAddDocument}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="ghost"
								onClick={() => onOpenChange(false)}
							>
								Batal
							</Button>
							<Button type="submit" disabled={loading}>
								{loading && (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								)}
								Simpan Kontrak
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
