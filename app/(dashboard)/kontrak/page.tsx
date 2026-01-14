"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, Contract } from "./columns";

export default function KontrakPage() {
	const [data, setData] = useState<Contract[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [totalContracts, setTotalContracts] = useState<number>(0);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch("/api/contracts");
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

	useEffect(() => {
			const fetchTotalContracts = async () => {
				try {
					const res = await fetch("/api/contracts");
					if (!res.ok) throw new Error("Failed to fetch");
					const result = await res.json();
	
					setTotalContracts(result.data?.length ?? 0);
				} catch (e) {
					console.error(e);
				} finally {
					setIsLoading(false);
				}
			};
	
			fetchTotalContracts();
		}, []);

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

			{/* Quick Stats */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Kontrak Aktif
						</CardTitle>
						<CheckSquare className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{totalContracts}</div>
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
							filterKey="contract_number"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
