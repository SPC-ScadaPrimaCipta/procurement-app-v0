"use client";

import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/datatable/data-table";
import { columns } from "@/app/(dashboard)/pengadaan/columns";
import { ShoppingCart } from "lucide-react";

interface RecentProcurementCardProps {
	procurementCases: any[];
}

export function RecentProcurementCard({
	procurementCases,
}: RecentProcurementCardProps) {
	const router = useRouter();

	return (
		<Card className="lg:col-span-2">
			<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<CardTitle>Pengadaan</CardTitle>
					<CardDescription>Pengadaan terkini</CardDescription>
				</div>
				<div className="p-2 bg-cyan-500/10 rounded-lg">
					<ShoppingCart className="h-6 w-6 text-cyan-500" />
				</div>
			</CardHeader>
			<CardContent className="p-0">
				<div className="px-4">
					<DataTable
						columns={columns}
						data={procurementCases}
						filterKey="title"
					/>
					<Button
						variant="outline"
						className="rounded-md text-sm"
						onClick={() => router.push("/pengadaan")}
					>
						Lihat semua pengadaan
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
