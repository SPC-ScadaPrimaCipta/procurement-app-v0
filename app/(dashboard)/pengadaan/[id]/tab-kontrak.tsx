"use client";

import { format } from "date-fns";
import { Briefcase, Building2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProcurementCaseDetail } from "./types";

interface TabKontrakProps {
	data: ProcurementCaseDetail;
}

export function TabKontrak({ data }: TabKontrakProps) {
	const { contract } = data;

	return contract ? (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<CardTitle className="text-lg flex items-center gap-2">
						<Briefcase className="w-5 h-5 text-primary" />
						Informasi Kontrak
					</CardTitle>
					<Badge variant="outline">
						{contract.contract_status?.name}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
				<div className="space-y-1">
					<p className="text-sm font-medium text-muted-foreground">
						Nomor Kontrak
					</p>
					<p className="font-mono font-medium">
						{contract.contract_number}
					</p>
				</div>
				<div className="space-y-1">
					<p className="text-sm font-medium text-muted-foreground">
						Nilai Kontrak
					</p>
					<p className="font-bold text-lg text-primary">
						{new Intl.NumberFormat("id-ID", {
							style: "currency",
							currency: "IDR",
						}).format(contract.contract_value)}
					</p>
				</div>
				<div className="space-y-1 md:col-span-2">
					<p className="text-sm font-medium text-muted-foreground">
						Vendor / Penyedia
					</p>
					<div className="flex items-center gap-2 p-3 border rounded-md bg-muted/10">
						<Building2 className="w-5 h-5 text-muted-foreground" />
						<p className="font-medium">
							{contract.vendor?.vendor_name || "-"}
						</p>
					</div>
				</div>
				<div className="space-y-1">
					<p className="text-sm font-medium text-muted-foreground">
						Periode Pelaksanaan
					</p>
					<div className="flex gap-2 items-center">
						<Calendar className="w-4 h-4 text-muted-foreground" />
						<span>
							{format(
								new Date(contract.start_date),
								"dd MMM yyyy"
							)}
							{" - "}
							{format(new Date(contract.end_date), "dd MMM yyyy")}
						</span>
					</div>
				</div>
				<div className="space-y-1 md:col-span-2">
					<p className="text-sm font-medium text-muted-foreground">
						Uraian Pekerjaan
					</p>
					<p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
						{contract.work_description}
					</p>
				</div>
			</CardContent>
		</Card>
	) : (
		<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
			<Briefcase className="h-8 w-8 text-muted-foreground/50 mb-3" />
			<p className="text-muted-foreground mb-4">
				Belum ada kontrak yang dibuat.
			</p>
			<Button variant="outline">Buat Kontrak Baru</Button>
		</div>
	);
}
