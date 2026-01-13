"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, ProcurementCase } from "./columns";

export default function PengadaanPage() {
	const [data, setData] = useState<ProcurementCase[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/procurement-cases");
				if (!response.ok) throw new Error("Failed to fetch data");

				const result = await response.json();
				setData(result.data);
			} catch (error) {
				console.error("Error fetching procurement cases:", error);
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
						Daftar Pengadaan
					</h1>
					<p className="text-muted-foreground">
						Manajemen seluruh proses pengadaan barang dan jasa.
					</p>
				</div>
				{/* <Button asChild>
					<Link href="/pengadaan/new">
						<Plus className="mr-2 h-4 w-4" />
						Buat Pengadaan
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
							filterKey="title"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
