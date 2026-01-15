"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import {
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip as RechartsTooltip,
	Bar,
	ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/datatable/data-table";
import { columns } from "../pengadaan/columns";
import { Container } from "lucide-react";

const KPI = [
	{ label: "Monthly Recurring Revenue", value: "$82.4K", delta: "+12.4%" },
	{ label: "Active Subscriptions", value: "5,983", delta: "+4.1%" },
	{ label: "Support Tickets", value: "126", delta: "-9.2%" },
	{ label: "Avg. Response Time", value: "2m 14s", delta: "-32%" },
];

const REVENUE_TREND = [
	{ label: "Mon", value: 48 },
	{ label: "Tue", value: 62 },
	{ label: "Wed", value: 52 },
	{ label: "Thu", value: 74 },
	{ label: "Fri", value: 68 },
	{ label: "Sat", value: 44 },
	{ label: "Sun", value: 38 },
];

const PIPELINE = [
	{
		company: "Pulse Analytics",
		owner: "Danika Wu",
		value: "$28,400",
		stage: "Contract review",
	},
	{
		company: "Northwind Retail",
		owner: "Marco Reyes",
		value: "$16,900",
		stage: "Proposal sent",
	},
	{
		company: "Quill Systems",
		owner: "Gabrielle Lee",
		value: "$11,250",
		stage: "Demo scheduled",
	},
	{
		company: "Atlas Manufacturing",
		owner: "Cedric Ruiz",
		value: "$45,700",
		stage: "Final approval",
	},
];

const ACTIVITY = [
	{
		id: "ACT-1024",
		team: "Design Systems",
		status: "Released",
		summary: "v3 foundations published",
	},
	{
		id: "ACT-1061",
		team: "Marketing Ops",
		status: "Blocked",
		summary: "Attribution export for Q1",
	},
	{
		id: "ACT-1088",
		team: "Billing",
		status: "On track",
		summary: "Automated renewals rollout",
	},
];

export default function DashboardPage() {
	const [isLoading, setIsLoading] = useState(true);
	const [totalContracts, setTotalContracts] = useState<number>(0);
	const [totalReimbursement, setTotalReimbursement] = useState<number>(0);
	const [totalCorrespondenceIn, setTotalCorrespondenceIn] = useState<number>(0);
	const [totalCorrespondenceOut, setTotalCorrespondenceOut] = useState<number>(0);
	const [vendors, setVendors] = useState<{ supplier_type?: { name?: string } }[]>([]);
	const [vendorGroup, setVendorGroup] = useState<number>(0);
	const [vendorTrend, setVendorTrend] = useState<{ label: string; value: number }[]>([]);
	const [procurementCases, setProcurementCases] = useState<any[]>([]);
	const router = useRouter();

	useEffect(() => {
		const fetchContracts = async () => {
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

		fetchContracts();
	}, []);

	useEffect(() => {
		const fetchReimbursement = async () => {
			try {
				const res = await fetch("/api/reimbursement");
				if (!res.ok) throw new Error("Failed to fetch");
				const result = await res.json();

				setTotalReimbursement(result.data?.length ?? 0);
			} catch (e) {
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchReimbursement();
	}, []);

	useEffect(() => {
		const fetchCorrespondenceIn = async () => {
			try {
				const res = await fetch("/api/nota-dinas/in");
				if (!res.ok) throw new Error("Failed to fetch");
				const result = await res.json();

				setTotalCorrespondenceIn(result.data?.length ?? 0);
			} catch (e) {
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchCorrespondenceIn();
	}, []);

	useEffect(() => {
		const fetchCorrespondenceOut = async () => {
			try {
				const res = await fetch("/api/nota-dinas/out");
				if (!res.ok) throw new Error("Failed to fetch");
				const result = await res.json();

				setTotalCorrespondenceOut(result.data?.length ?? 0);
			} catch (e) {
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchCorrespondenceOut();
	}, []);

	useEffect(() => {
		const fetchVendorGroup = async () => {
			try {
				const res = await fetch("/api/vendors");
				if (!res.ok) throw new Error("Failed to fetch");

				const result = await res.json();
				const data = result.data ?? [];

				setVendors(data);

				// --- changed grouping logic here ---
				const uniqueTypes = new Set(
					data.map((v: any) => v.supplier_type?.name?.trim())
				);

				setVendorGroup(uniqueTypes.size);
			} catch (e) {
				console.error("Error fetching vendor group:", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchVendorGroup();
	}, []);

	useEffect(() => {
		if (!vendors.length) return;

		const map = new Map();

		for (const v of vendors) {
			const typeName = v.supplier_type?.name?.trim() || "Unknown";

			map.set(typeName, (map.get(typeName) || 0) + 1);
		}

		setVendorTrend(
			[...map.entries()].map(([label, value]) => ({ label, value }))
		);
	}, [vendors]);

	useEffect(() => {
		const fetchProcurementCases = async () => {
			try {
				const response = await fetch("/api/procurement-cases");
				if (!response.ok) throw new Error("Failed to fetch data");

				const result = await response.json();
				setProcurementCases(result.data.slice(0, 4));
			} catch (error) {
				console.error("Error fetching procurement cases:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchProcurementCases();
	}, []);

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Dashboard</h1>
					<p className="text-muted-foreground">
						Key revenue, retention, and operational signals for this
						week.
					</p>
				</div>
				<div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
					{/* <Select defaultValue="7d">
						<SelectTrigger className="w-full sm:w-32">
							<SelectValue placeholder="Range" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="7d">Last 7 days</SelectItem>
							<SelectItem value="30d">Last 30 days</SelectItem>
							<SelectItem value="90d">Last 90 days</SelectItem>
						</SelectContent>
					</Select> */}
					<Button variant="outline" className="w-full sm:w-auto">
						Download report
					</Button>
					<Button className="w-full sm:w-auto">Share snapshot</Button>
				</div>
			</header>

			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				<Card>
					<CardHeader>
						<CardDescription>Semua Kontrak</CardDescription>
						<CardTitle className="text-3xl">
							{isLoading ? "Loading..." : totalContracts}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription>Semua Non Kontrak</CardDescription>
						<CardTitle className="text-3xl">
							{isLoading ? "Loading..." : totalReimbursement}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription>Semua Nota Dinas Masuk</CardDescription>
						<CardTitle className="text-3xl">
							{isLoading ? "Loading..." : totalCorrespondenceIn}
						</CardTitle>
					</CardHeader>
				</Card>

				<Card>
					<CardHeader>
						<CardDescription>Semua Nota Dinas Keluar</CardDescription>
						<CardTitle className="text-3xl">
							{isLoading ? "Loading..." : totalCorrespondenceOut}
						</CardTitle>
					</CardHeader>
				</Card>

			</section>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader>
						<CardTitle>Pengelompokan Penyedia</CardTitle>
						<CardDescription>Dikelompokan berdasarkan jenis penyedia</CardDescription>
					</CardHeader>
					<CardContent>
						{isLoading ? (
							<p className="text-sm text-muted-foreground">Loading...</p>
						) : (
							<div className="w-full h-96">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={[...vendorTrend].sort((a, b) => a.value - b.value)} responsive margin={{top: 5, bottom: 5, left: 0, right: 0}}>
										<CartesianGrid stroke="rgba(255,255,255,0.2)" strokeDasharray="3 3" />
										<XAxis
											dataKey="label"
											stroke="rgba(255,255,255,0.6)"
											tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
										/>
										<YAxis
											stroke="rgba(255,255,255,0.6)"
											tick={{ fill: "rgba(255,255,255,0.8)", fontSize: 12 }}
										/>
										<RechartsTooltip
											contentStyle={{
												background: "#1e1e1e",
												border: "1px solid rgba(255,255,255,0.2)",
												color: "white",
											}}
										/>
										<Bar dataKey="value" fill="#4F46E5" radius={[10, 10, 0, 0]} /> {/* indigo/primary */}
									</BarChart>
								</ResponsiveContainer >
							</div>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Kotak Masuk</CardTitle>
						<CardDescription>
							Sekilas kotak masuk.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{ACTIVITY.map((item) => (
							<div
								key={item.id}
								className="rounded-xl border p-4"
							>
								<p className="text-xs font-semibold text-muted-foreground">
									{item.id}
								</p>
								<p className="font-medium">{item.summary}</p>
								<div className="mt-2 flex items-center justify-between text-sm">
									<span className="text-muted-foreground">
										{item.team}
									</span>
									<span
										className={`font-medium ${
											item.status === "Blocked"
												? "text-red-500"
												: "text-emerald-500"
										}`}
									>
										{item.status}
									</span>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<section className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<CardTitle>Pengadaan</CardTitle>
							<CardDescription>
								Pengadaan terkini
							</CardDescription>
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
				<Card>
					<CardHeader>
						<CardTitle>Pintasan</CardTitle>
						<CardDescription>
							Akses cepat ke tindakan umum
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Button
							className="w-full justify-start"
							variant="outline"
							onClick={() => router.push("/admin/users")}
						>
							Daftarkan Pengguna Baru
						</Button>
						<Button
							className="w-full justify-start"
							variant="outline"
							onClick={() => router.push("/admin/roles")}
						>
							Tetapkan Peran Pada Pengguna 
						</Button>
						<Button
							className="w-full justify-start"
							variant="outline"
							onClick={() => router.push("/admin/permissions")}
						>
							Buat Perizinan Baru
						</Button>
						<Button
							className="w-full justify-start"
							variant="outline"
							onClick={() => router.push("/workflow/manage")}
						>
							Membuat Alur Kerja Baru
						</Button>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

