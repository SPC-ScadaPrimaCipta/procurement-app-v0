"use client";

import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { ProcurementCaseDetail } from "./types";

interface TabSuratKeluarProps {
	data: ProcurementCaseDetail;
}

export function TabSuratKeluar({ data }: TabSuratKeluarProps) {
	const { correspondence_out } = data;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-lg">Daftar Surat Keluar</CardTitle>
			</CardHeader>
			<CardContent className="p-0">
				{correspondence_out.length > 0 ? (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="pl-6">
									No. Surat
								</TableHead>
								<TableHead>Tanggal</TableHead>
								<TableHead>Tujuan</TableHead>
								<TableHead>Perihal</TableHead>
								<TableHead className="pr-6">Dibuat</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{correspondence_out.map((item) => (
								<TableRow key={item.id}>
									<TableCell className="pl-6 font-medium">
										{item.letter_number}
									</TableCell>
									<TableCell>
										{format(
											new Date(item.letter_date),
											"dd/MM/yy"
										)}
									</TableCell>
									<TableCell>{item.to_name}</TableCell>
									<TableCell className="max-w-[180px] truncate">
										{item.subject}
									</TableCell>
									<TableCell className="pr-6">
										{item.created_by_name || "-"}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				) : (
					<div className="text-center py-12 text-muted-foreground text-sm">
						Tidak ada surat keluar tercatat.
					</div>
				)}
			</CardContent>
		</Card>
	);
}
