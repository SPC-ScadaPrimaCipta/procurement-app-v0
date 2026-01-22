"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, ProcurementCase } from "./columns";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";
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

	if (isLoading) {
		return <TablePageSkeleton showButton={false} />;
	}

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
				<StatsCard
					title="Total Pengadaan"
					value={stats.total}
					icon={FileText}
					iconContainerClassName="bg-primary/10"
					iconClassName="text-primary"
				/>
				<StatsCard
					title="Dalam Proses"
					value={stats.active}
					icon={Clock}
					iconContainerClassName="bg-orange-500/10"
					iconClassName="text-orange-500"
				/>
				<StatsCard
					title="Selesai"
					value={stats.completed}
					icon={CheckCircle2}
					iconContainerClassName="bg-green-500/10"
					iconClassName="text-green-500"
				/>
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
