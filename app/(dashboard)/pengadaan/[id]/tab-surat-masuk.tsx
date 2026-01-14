"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Mail, FileText, Edit, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
} from "@/components/ui/card";
import { DispositionModal } from "@/components/disposition/disposition-modal";
import { ProcurementCaseDetail } from "./types";

interface TabSuratMasukProps {
	data: ProcurementCaseDetail;
	onDataChange: () => void;
}

export function TabSuratMasuk({ data, onDataChange }: TabSuratMasukProps) {
	const [isDispositionModalOpen, setIsDispositionModalOpen] = useState(false);
	const { correspondence_in, case_disposition_summary, id: caseId } = data;

	return (
		<>
			{correspondence_in ? (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Mail className="w-5 h-5 text-primary" />
							Detail Surat Masuk
						</CardTitle>
					</CardHeader>
					<CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Nomor Surat
							</p>
							<p className="font-medium text-base">
								{correspondence_in.letter_number}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Tanggal Surat
							</p>
							<p className="font-medium text-base">
								{format(
									new Date(correspondence_in.letter_date),
									"dd MMMM yyyy"
								)}
							</p>
						</div>
						<div className="space-y-1 md:col-span-2">
							<p className="text-sm font-medium text-muted-foreground">
								Pengirim
							</p>
							<p className="font-medium text-base">
								{correspondence_in.from_name}
							</p>
						</div>
						<div className="space-y-1 md:col-span-2">
							<p className="text-sm font-medium text-muted-foreground">
								Perihal
							</p>
							<div className="p-3 bg-muted/20 rounded-md">
								<p className="font-medium leading-relaxed">
									{correspondence_in.subject}
								</p>
							</div>
						</div>
						<div className="md:col-span-2 pt-2">
							<Button variant="outline" size="sm" asChild>
								<a
									href={`/nota-dinas/surat-masuk/${correspondence_in.id}`}
								>
									Lihat Surat Asli
								</a>
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
					<div className="bg-muted p-3 rounded-full mb-3">
						<Mail className="h-6 w-6 text-muted-foreground" />
					</div>
					<p className="text-muted-foreground font-medium">
						Tidak ada data Surat Masuk.
					</p>
				</div>
			)}

			<div className="mt-6">
				{case_disposition_summary ? (
					<Card className="border-l-4 border-l-green-500 shadow-sm bg-green-50/50 dark:bg-green-950/20">
						<CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
							<div className="space-y-1">
								<CardTitle className="text-base flex items-center gap-2">
									<FileText className="w-5 h-5 text-green-600" />
									Lembar Disposisi
								</CardTitle>
								<CardDescription>
									Disposisi telah dibuat.
								</CardDescription>
							</div>

							{data?.currentStepInstanceId && (
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										setIsDispositionModalOpen(true)
									}
								>
									<Edit className="w-4 h-4 mr-2" />
									Edit
								</Button>
							)}
						</CardHeader>
						<CardContent className="p-4 space-y-4">
							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-muted-foreground font-medium">
										No. Agenda
									</p>
									<p>
										{case_disposition_summary.agenda_number}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground font-medium">
										Tanggal
									</p>
									<p>
										{case_disposition_summary.disposition_date
											? format(
													new Date(
														case_disposition_summary.disposition_date
													),
													"dd MMM yyyy"
											  )
											: "-"}
									</p>
								</div>
							</div>

							{/* Instructions */}
							{case_disposition_summary.disposition_actions &&
								case_disposition_summary.disposition_actions
									.length > 0 && (
									<div>
										<p className="text-muted-foreground font-medium mb-1">
											Instruksi / Disposisi
										</p>
										<div className="flex flex-wrap gap-2">
											{case_disposition_summary.disposition_actions.map(
												(action, idx) => (
													<span
														key={idx}
														className="bg-secondary px-2 py-1 rounded text-xs font-medium border"
													>
														{action}
													</span>
												)
											)}
										</div>
									</div>
								)}

							{/* Forwarded To */}
							{case_disposition_summary.forward_to &&
								case_disposition_summary.forward_to.length >
									0 && (
									<div>
										<p className="text-muted-foreground font-medium mb-1">
											Diteruskan Kepada
										</p>
										<div className="flex flex-wrap gap-2">
											{case_disposition_summary.forward_to.map(
												(item, idx) => (
													<span
														key={idx}
														className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium border border-blue-200 dark:border-blue-800"
													>
														{item.recipient.name}
													</span>
												)
											)}
										</div>
									</div>
								)}

							{case_disposition_summary.disposition_note && (
								<div>
									<p className="text-muted-foreground font-medium mb-1">
										Catatan
									</p>
									<p className="bg-white dark:bg-secondary p-2 rounded border text-sm">
										{
											case_disposition_summary.disposition_note
										}
									</p>
								</div>
							)}
						</CardContent>
					</Card>
				) : (
					data?.currentStepInstanceId && (
						<Card className="border-dashed border-2 shadow-none">
							<CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
								<div className="bg-primary/10 p-3 rounded-full">
									<FilePlus2 className="w-8 h-8 text-primary" />
								</div>
								<div className="text-center space-y-1">
									<h3 className="font-semibold text-lg">
										Buat Disposisi
									</h3>
									<p className="text-sm text-muted-foreground max-w-sm">
										Anda perlu membuat lembar disposisi
										sebelum dapat melanjutkan proses ini.
									</p>
								</div>
								<Button
									onClick={() =>
										setIsDispositionModalOpen(true)
									}
								>
									Tambah Disposisi
								</Button>
							</CardContent>
						</Card>
					)
				)}
			</div>

			<DispositionModal
				open={isDispositionModalOpen}
				onOpenChange={setIsDispositionModalOpen}
				caseId={caseId}
				initialData={case_disposition_summary}
				onSuccess={() => {
					onDataChange();
				}}
			/>
		</>
	);
}
