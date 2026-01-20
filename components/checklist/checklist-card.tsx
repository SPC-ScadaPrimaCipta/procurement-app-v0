import {
	CheckCircle2,
	XCircle,
	Clock,
	FileText,
	Upload,
	ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ChecklistUploadDialog } from "./checklist-upload-dialog";
import { ChecklistVerifyDialog } from "./checklist-verify-dialog";

export type ChecklistItem = {
	requirementId: string;
	name: string;
	required: boolean;
	mode: "AUTO" | "MANUAL";
	status: "PASS" | "FAIL" | "PENDING";
	docTypeId?: string | null;
	evidence?: {
		documentId: string;
		fileUrl: string;
		fileName?: string | null;
	} | null;
};

export type ChecklistData = {
	caseStep?: { id: string; name: string };
	summary: {
		requiredTotal: number;
		passed: number;
		missing: number;
		isComplete: boolean;
	};
	items: ChecklistItem[];
};

function StatusIcon({ status }: { status: ChecklistItem["status"] }) {
	if (status === "PASS")
		return <CheckCircle2 className="w-5 h-5 text-green-600" />;
	if (status === "FAIL") return <XCircle className="w-5 h-5 text-red-600" />;
	return <Clock className="w-5 h-5 text-muted-foreground" />;
}

export function ChecklistCard({
	checklist,
	onUploadDocType,
	caseId,
	caseCode,
	onRefresh,
	canVerify = false,
}: {
	checklist: ChecklistData | null;
	onUploadDocType: (docTypeId: string) => void;
	caseId?: string; // Add caseId
	caseCode?: string; // Add caseCode
	onRefresh?: () => void; // Add refresh handler
	canVerify?: boolean;
}) {
	const summary = checklist?.summary;
	const items = checklist?.items ?? [];

	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedItem, setSelectedItem] = useState<{
		docTypeId: string;
		name: string;
	} | null>(null);

	const handleUploadClick = (docTypeId: string, name: string) => {
		setSelectedItem({ docTypeId, name });
		setDialogOpen(true);
	};

	const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
	const [selectedVerifyItem, setSelectedVerifyItem] = useState<{
		requirementId: string;
		name: string;
	} | null>(null);

	const handleVerifyClick = (requirementId: string, name: string) => {
		setSelectedVerifyItem({ requirementId, name });
		setVerifyDialogOpen(true);
	};

	return (
		<Card>
			<CardHeader className="space-y-1">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="text-base">
						Kelengkapan Dokumen
					</CardTitle>

					{summary ? (
						<Badge
							variant={
								summary.isComplete ? "default" : "secondary"
							}
							className="rounded-full"
						>
							{summary.passed}/{summary.requiredTotal}
						</Badge>
					) : (
						<Badge variant="secondary" className="rounded-full">
							-
						</Badge>
					)}
				</div>

				{/* {checklist?.caseStep?.name ? (
					<div className="text-xs text-muted-foreground">
						Step:{" "}
						<span className="font-medium">
							{checklist.caseStep.name}
						</span>
					</div>
				) : null} */}
			</CardHeader>

			<CardContent className="p-0">
				<div className="divide-y">
					{items.length === 0 ? (
						<div className="p-4 text-sm text-muted-foreground">
							Tidak ada requirement untuk step ini.
						</div>
					) : (
						items.map((it) => (
							<div
								key={it.requirementId}
								className="flex items-center justify-between p-4 gap-3"
							>
								<div className="flex items-center gap-3 min-w-0">
									<StatusIcon status={it.status} />
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<FileText className="w-4 h-4 text-muted-foreground" />
											<span className="text-sm font-medium truncate">
												{it.name}
											</span>
											{it.mode === "MANUAL" ? (
												<Badge
													variant="outline"
													className="text-[10px]"
												>
													Manual
												</Badge>
											) : null}
											{!it.required ? (
												<Badge
													variant="secondary"
													className="text-[10px]"
												>
													Opsional
												</Badge>
											) : null}
										</div>

										{it.evidence?.fileName ? (
											<div className="text-xs text-muted-foreground truncate">
												{it.evidence.fileName}
											</div>
										) : null}
									</div>
								</div>

								<div className="flex items-center gap-2">
									{/* Action */}
									{it.status !== "PASS" && it.docTypeId ? (
										<Button
											size="sm"
											variant="secondary"
											onClick={() =>
												handleUploadClick(
													it.docTypeId!,
													it.name,
												)
											}
										>
											<Upload className="w-4 h-4 mr-2" />
											Upload
										</Button>
									) : null}

									{it.status === "PASS" &&
									it.evidence?.fileUrl ? (
										<Button
											size="sm"
											variant="ghost"
											onClick={() =>
												window.open(
													it.evidence!.fileUrl,
													"_blank",
												)
											}
										>
											<ExternalLink className="w-4 h-4 mr-2" />
											Lihat
										</Button>
									) : null}

									{/* Manual verify (phase 2) */}
									{it.mode === "MANUAL" && canVerify ? (
										<Button
											size="sm"
											variant={
												it.status === "PASS"
													? "ghost"
													: "outline"
											}
											onClick={() =>
												handleVerifyClick(
													it.requirementId,
													it.name,
												)
											}
										>
											{it.status === "PASS"
												? "Edit Verifikasi"
												: "Verifikasi"}
										</Button>
									) : null}
								</div>
							</div>
						))
					)}
				</div>
			</CardContent>

			{checklist && caseId && caseCode && selectedItem && (
				<ChecklistUploadDialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
					title={selectedItem.name}
					docTypeId={selectedItem.docTypeId}
					caseId={caseId}
					caseCode={caseCode}
					onSuccess={() => {
						if (onRefresh) onRefresh();
					}}
				/>
			)}

			{checklist && caseId && selectedVerifyItem && (
				<ChecklistVerifyDialog
					open={verifyDialogOpen}
					onOpenChange={setVerifyDialogOpen}
					title={selectedVerifyItem.name}
					requirementId={selectedVerifyItem.requirementId}
					caseId={caseId}
					onSuccess={() => {
						if (onRefresh) onRefresh();
					}}
				/>
			)}
		</Card>
	);
}
