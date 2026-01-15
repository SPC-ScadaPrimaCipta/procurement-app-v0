"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, Contract } from "./columns";

export default function KontrakPage() {
	const [data, setData] = useState<Contract[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/contracts?all=true");
				if (!response.ok) throw new Error("Failed to fetch data");

				const result = await response.json();
				setData(result.data);
			} catch (error) {
				console.error("Error fetching contracts:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchData();
	}, []);

	// Calculate Stats
	const stats = {
		total: data.length,
		pending: data.filter((item) =>
			["DRAFT", "PENDING", "PROGRESS", "BERJALAN"].some((s) =>
				item.contract_status?.name?.toUpperCase().includes(s)
			)
		).length,
		active: data.filter((item) =>
			["AKTIF", "ACTIVE", "IN PROGRESS", "BERJALAN"].some((s) =>
				item.contract_status?.name?.toUpperCase().includes(s)
			)
		).length,
		completed: data.filter((item) =>
			["SELESAI", "COMPLETED", "DONE"].some((s) =>
				item.contract_status?.name?.toUpperCase().includes(s)
			)
		).length,
	};

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Daftar Kontrak
					</h1>
					<p className="text-muted-foreground">
						Manajemen kontrak pengadaan barang dan jasa.
					</p>
				</div>
				{/* Optional: Add button later if needed. Usually contracts are created from Procurement Case */}
				{/* <Button asChild>
					<Link href="/kontrak/new">
						<Plus className="mr-2 h-4 w-4" />
						Buat Kontrak Manual
					</Link>
				</Button> */}
			</div>

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatsCard
					title="Total Kontrak"
					value={stats.total}
					icon={FileText}
					iconContainerClassName="bg-primary/10"
					iconClassName="text-primary"
				/>
				<StatsCard
					title="Kontrak Pending"
					value={stats.pending}
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
							filterKey="contract_number"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
