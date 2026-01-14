"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, SuratKeluar } from "./columns";

export default function SuratKeluarPage() {
	const [data, setData] = useState<SuratKeluar[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/nota-dinas/out");
				if (!response.ok) throw new Error("Failed to fetch data");

				const result = await response.json();
				const mappedData: SuratKeluar[] = result.data.map(
					(item: any) => ({
						id: item.id,
						case_code: item.procurement_case?.case_code || "-",
						letter_number: item.letter_number,
						letter_date: new Date(item.letter_date)
							.toISOString()
							.split("T")[0],
						to: item.to_name,
						subject: item.subject,
						status:
							item.procurement_case?.status?.name || "Unknown",
						created_at: item.created_at,
					})
				);

				setData(mappedData);
			} catch (error) {
				console.error("Error fetching data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Surat Keluar
					</h1>
					<p className="text-muted-foreground">
						Daftar Surat Keluar yang telah dibuat.
					</p>
				</div>
				{/* Optional: Add creation button later if needed. Usually created from Case */}
				{/* <Button asChild>
					<Link href="/nota-dinas/surat-keluar/new">
						<Plus className="mr-2 h-4 w-4" />
						Buat Surat Keluar
					</Link>
				</Button> */}
			</div>

			{/* DataTable wrapped in Card */}
			<Card>
				<CardContent className="p-0">
					<div className="px-4">
						<DataTable
							columns={columns}
							data={data}
							filterKey="subject"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
