"use client";

// ... imports
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, FileText, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, NotaDinas } from "./columns";
// import { StatsCard } from "@/components/dashboard/stats-card";
import { useRequirePermission } from "@/hooks/use-require-permission";
import { TablePageSkeleton } from "@/components/skeletons/table-page-skeleton";
import { StatsCard } from "@/components/dashboard/stats-card";

export default function NotaDinasPage() {
	const [data, setData] = useState<NotaDinas[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Authorization - manage:users (for actions)
	const { isAuthorized: canManage } = useRequirePermission(
		"manage",
		"notadinas",
		{ redirect: false },
	);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/nota-dinas/in?all=true");
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
						procurement_id: item.procurement_case?.id || "",
					}),
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

	// Calculate Stats
	const stats = {
		total: data.length,
		active: data.filter((item) =>
			["IN_PROGRESS", "SUBMITTED", "WAITING", "DRAFT"].some((s) =>
				item.status.toUpperCase().includes(s),
			),
		).length,
		completed: data.filter((item) =>
			["APPROVED", "SELESAI", "COMPLETED", "DONE"].some((s) =>
				item.status.toUpperCase().includes(s),
			),
		).length,
	};

	if (isLoading) {
		return <TablePageSkeleton showButton={true} />;
	}

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex lg:items-center flex-col lg:flex-row lg:justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight ">
						Surat Masuk
					</h1>
					<p className="text-muted-foreground">
						Daftar Nota Dinas dan Surat Masuk yang perlu diproses.
					</p>
				</div>
				{canManage && (
					<Button asChild className="mt-2 lg:mt-0">
						<Link href="/nota-dinas/surat-masuk/new">
							<Plus className="mr-2 h-4 w-4" />
							Tambah Surat Masuk
						</Link>
					</Button>
				)}
			</div>

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<StatsCard
					title="Total Surat"
					value={stats.total}
					icon={FileText}
					iconClassName="text-primary"
				/>

				<StatsCard
					title="Diproses"
					value={stats.active}
					icon={Clock}
					iconClassName="text-orange-500"
				/>

				<StatsCard
					title="Selesai"
					value={stats.completed}
					icon={CheckCircle2}
					iconClassName="text-green-500"
				/>
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
