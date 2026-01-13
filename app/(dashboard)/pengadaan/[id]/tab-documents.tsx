"use client";

import { format } from "date-fns";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcurementCaseDetail } from "./types";

interface TabDocumentsProps {
	data: ProcurementCaseDetail;
}

export function TabDocuments({ data }: TabDocumentsProps) {
	const { document: documents } = data;

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{documents.map((doc) => (
					<Card
						key={doc.id}
						className="hover:shadow-md transition-all group"
					>
						<CardContent className="p-4 flex items-start justify-between gap-3">
							<div className="flex items-start gap-3 overflow-hidden">
								<div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
									<FileText className="h-5 w-5" />
								</div>
								<div className="min-w-0">
									<p
										className="font-medium truncate text-sm"
										title={
											doc.title ||
											doc.document_file[0]?.file_name
										}
									>
										{doc.title ||
											doc.document_file[0]?.file_name ||
											"Dokumen"}
									</p>
									<div className="flex items-center gap-2 mt-1">
										<Badge
											variant="secondary"
											className="text-[10px] h-5 px-1.5"
										>
											{doc.master_doc_type.name}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{format(
												new Date(doc.created_at),
												"dd MMM yyyy"
											)}
										</span>
									</div>
									<p className="text-xs text-muted-foreground mt-1 truncate">
										{doc.doc_number || "No number"}
									</p>
								</div>
							</div>
							{doc.document_file[0]?.file_url && (
								<Button
									variant="ghost"
									size="icon"
									className="shrink-0 h-8 w-8"
									asChild
								>
									<a
										href={doc.document_file[0].file_url}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Download className="h-4 w-4" />
									</a>
								</Button>
							)}
						</CardContent>
					</Card>
				))}
			</div>
			{documents.length === 0 && (
				<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
					<FileText className="h-10 w-10 text-muted-foreground/50 mb-3" />
					<p className="text-muted-foreground">
						Tidak ada dokumen lampiran.
					</p>
				</div>
			)}
		</>
	);
}
