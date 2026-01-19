import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { format } from "date-fns";

interface DocumentsTabProps {
	procurement_case: {
		case_code: string;
		document: Array<{
			id: string;
			title: string;
			created_at: string;
			master_doc_type: { name: string };
			file_name?: string;
			file_url?: string;
		}>;
	};
}

export function DocumentsTab({ procurement_case }: DocumentsTabProps) {
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return format(new Date(dateString), "dd MMM yyyy");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Dokumen Terkait</CardTitle>
				<CardDescription>
					Dokumen dari pengadaan {procurement_case.case_code}
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{procurement_case?.document?.map((doc) => (
						<div
							key={doc.id}
							className="flex items-start justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
						>
							<div className="flex items-start gap-3 overflow-hidden">
								<div className="h-8 w-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
									<FileText className="h-4 w-4" />
								</div>
								<div className="min-w-0">
									<p className="text-sm font-medium truncate">
										{doc.title ||
											doc.file_name ||
											"Dokumen"}
									</p>
									<div className="flex items-center gap-2 mt-1">
										<Badge
											variant="outline"
											className="text-[10px] h-4 px-1 font-normal"
										>
											{doc.master_doc_type?.name ||
												"Lainnya"}
										</Badge>
										<span className="text-[10px] text-muted-foreground">
											{formatDate(doc.created_at)}
										</span>
									</div>
								</div>
							</div>
							{doc.file_url && (
								<Button
									variant="ghost"
									size="icon"
									className="h-8 w-8 shrink-0"
									asChild
								>
									<a
										href={doc.file_url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Download className="h-4 w-4 text-muted-foreground" />
									</a>
								</Button>
							)}
						</div>
					))}
					{procurement_case?.document?.length === 0 && (
						<div className="col-span-full flex flex-col items-center justify-center py-8 text-muted-foreground">
							<FileText className="h-8 w-8 mb-2 opacity-50" />
							<p>Tidak ada dokumen tersedia.</p>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
