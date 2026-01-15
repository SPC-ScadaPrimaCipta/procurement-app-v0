"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, ProcurementCase } from "./columns";

import { FileText, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export default function PengadaanPage() {
	const [data, setData] = useState<ProcurementCase[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/procurement-cases?all=true");
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

	// Calculate Stats
	const stats = {
		total: data.length,
		active: data.filter((item) =>
			["IN_PROGRESS", "SUBMITTED", "WAITING", "DRAFT"].some((s) =>
				item.status.name.toUpperCase().includes(s)
			)
		).length,
		completed: data.filter((item) =>
			["APPROVED", "SELESAI", "COMPLETED", "DONE"].some((s) =>
				item.status.name.toUpperCase().includes(s)
			)
		).length,
	};

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
			</div>

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardContent className="p-6 flex items-center gap-4">
						<div className="p-3 bg-primary/10 rounded-full text-primary">
							<FileText className="h-6 w-6" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Total Pengadaan
							</p>
							<h3 className="text-2xl font-bold">
								{stats.total}
							</h3>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6 flex items-center gap-4">
						<div className="p-3 bg-orange-500/10 rounded-full text-orange-500">
							<Clock className="h-6 w-6" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Dalam Proses
							</p>
							<h3 className="text-2xl font-bold">
								{stats.active}
							</h3>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6 flex items-center gap-4">
						<div className="p-3 bg-green-500/10 rounded-full text-green-500">
							<CheckCircle2 className="h-6 w-6" />
						</div>
						<div>
							<p className="text-sm font-medium text-muted-foreground">
								Selesai
							</p>
							<h3 className="text-2xl font-bold">
								{stats.completed}
							</h3>
						</div>
					</CardContent>
				</Card>
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
