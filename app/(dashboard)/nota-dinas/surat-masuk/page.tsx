"use client";

// ... imports
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, NotaDinas } from "./columns";

export default function NotaDinasPage() {
	const [data, setData] = useState<NotaDinas[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/nota-dinas/in");
				if (!response.ok) throw new Error("Failed to fetch data");

				const result = await response.json();
				// Map API response to NotaDinas type
				const mappedData: NotaDinas[] = result.data.map(
					(item: any) => ({
						id: item.id,
						case_code: item.procurement_case?.case_code || "-",
						letter_number: item.letter_number,
						letter_date: new Date(item.letter_date)
							.toISOString()
							.split("T")[0],
						from: item.from_name,
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
		<div className="md:p-6 space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Surat Masuk
					</h1>
					<p className="text-muted-foreground">
						Daftar Nota Dinas dan Surat Masuk yang perlu diproses.
					</p>
				</div>
				<Button asChild>
					<Link href="/nota-dinas/surat-masuk/new">
						<Plus className="mr-2 h-4 w-4" />
						Tambah Surat Masuk
					</Link>
				</Button>
			</div>

			{/* DataTable wrapped in Card */}
			<Card>
				<CardContent className="p-0">
					<div className="p-4">
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
