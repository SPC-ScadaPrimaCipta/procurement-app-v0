"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { VendorGroupingCard } from "@/components/dashboard/vendor-grouping-card";
import { ContractStatusGroupingCard } from "@/components/dashboard/contract-status-grouping-card";
import { InboxCard } from "@/components/dashboard/inbox-card";
import { RecentProcurementCard } from "@/components/dashboard/recent-procurement-card";
import { ShortcutsCard } from "@/components/dashboard/shortcuts-card";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { FileText, Inbox, Receipt, Send } from "lucide-react";

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
	const [loading, setLoading] = useState({
		contracts: true,
		reimbursement: true,
		corrIn: true,
		corrOut: true,
		vendors: true,
		cases: true,
		inbox: true,
	});
	const [isLoading, setIsLoading] = useState(true); // Removed simple state
	const [totalContracts, setTotalContracts] = useState<number>(0);
	const [totalReimbursement, setTotalReimbursement] = useState<number>(0);
	const [totalCorrespondenceIn, setTotalCorrespondenceIn] =
		useState<number>(0);
	const [totalCorrespondenceOut, setTotalCorrespondenceOut] =
		useState<number>(0);
	const [vendors, setVendors] = useState<
		{ supplier_type?: { name?: string } }[]
	>([]);
	const [vendorGroup, setVendorGroup] = useState<number>(0);
	const [contractStatuses, setContractStatuses] = useState<any[]>([]);
	const [vendorTrend, setVendorTrend] = useState<
		{ label: string; value: number }[]
	>([]);
	const [procurementCases, setProcurementCases] = useState<any[]>([]);
	const [inboxItems, setInboxItems] = useState<any[]>([]);
	const [inboxLoading, setInboxLoading] = useState<boolean>(true);
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
				setLoading((prev) => ({ ...prev, contracts: false }));
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
				setLoading((prev) => ({ ...prev, reimbursement: false }));
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
				setLoading((prev) => ({ ...prev, corrIn: false }));
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
				setLoading((prev) => ({ ...prev, corrOut: false }));
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

				const uniqueTypes = new Set(
					data.map((v: any) => v.supplier_type?.name?.trim()),
				);

				setVendorGroup(uniqueTypes.size);
			} catch (e) {
				console.error("Error fetching vendor group:", e);
			} finally {
				setLoading((prev) => ({ ...prev, vendors: false }));
			}
		};

		fetchVendorGroup();
	}, []);

	useEffect(() => {
		const fetchContractStatuses = async () => {
			try {
				const res = await fetch("/api/contracts");
				if (!res.ok) throw new Error("Failed to fetch");

				const result = await res.json();
				const data = result.data ?? [];

				const statusMap = new Map<
					string,
					{ count: number; sortOrder: number | null }
				>();

				data.forEach((item: any) => {
					const statusName = item.contract_status?.name || "Unknown";
					const sortOrder = item.contract_status?.sort_order ?? null;

					if (!statusMap.has(statusName)) {
						statusMap.set(statusName, { count: 1, sortOrder });
					} else {
						statusMap.get(statusName)!.count++;
					}
				});

				// Convert map to array
				let formatted = [...statusMap.entries()].map(([name, val]) => ({
					name,
					count: val.count,
					sortOrder: val.sortOrder,
				}));

				// Optional: sort based on DB sort_order
				formatted.sort((a, b) => {
					if (a.sortOrder == null) return 1;
					if (b.sortOrder == null) return -1;
					return a.sortOrder - b.sortOrder;
				});

				setContractStatuses(formatted);
				console.log("Computed contract statuses:", formatted);
			} catch (e) {
				console.error("Error fetching contract statuses:", e);
			} finally {
				setIsLoading(false);
			}
		};

		fetchContractStatuses();
	}, []);

	useEffect(() => {
		const fetchInbox = async () => {
			setInboxLoading(true);
			try {
				const res = await fetch("/api/workflow-inbox");
				if (!res.ok) throw new Error("Failed to fetch inbox");
				const result = await res.json();

				const items = result.items ?? [];
				items.sort((a: any, b: any) => {
					const ta = a?.createdAt
						? new Date(a.createdAt).getTime()
						: 0;
					const tb = b?.createdAt
						? new Date(b.createdAt).getTime()
						: 0;
					return tb - ta;
				});
				setInboxItems(items.slice(0, 3));
			} catch (e) {
				console.error("Error fetching inbox:", e);
			} finally {
				setInboxLoading(false);
				setLoading((prev) => ({ ...prev, inbox: false }));
			}
		};

		fetchInbox();
	}, []);

	useEffect(() => {
		if (!vendors.length) return;

		const map = new Map();

		for (const v of vendors) {
			const typeName = v.supplier_type?.name?.trim() || "Unknown";

			map.set(typeName, (map.get(typeName) || 0) + 1);
		}

		setVendorTrend(
			[...map.entries()].map(([label, value]) => ({ label, value })),
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
				setLoading((prev) => ({ ...prev, cases: false }));
			}
		};

		fetchProcurementCases();
	}, []);

	const isPageLoading = Object.values(loading).some(Boolean);

	if (isPageLoading) {
		return <DashboardSkeleton />;
	}

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
				<DashboardMetricCard
					title="Semua Kontrak"
					value={totalContracts}
					icon={FileText}
					iconClassName="text-indigo-500"
				/>
				<DashboardMetricCard
					title="Semua Non Kontrak"
					value={totalReimbursement}
					icon={Receipt}
					iconClassName="text-emerald-500"
				/>
				<DashboardMetricCard
					title="Semua Nota Dinas Masuk"
					value={totalCorrespondenceIn}
					icon={Inbox}
					iconClassName="text-blue-500"
				/>
				<DashboardMetricCard
					title="Semua Nota Dinas Keluar"
					value={totalCorrespondenceOut}
					icon={Send}
					iconClassName="text-orange-500"
				/>
			</section>

			<div className="grid gap-6 lg:grid-cols-4">
				<VendorGroupingCard
					vendorTrend={vendorTrend}
					isLoading={isLoading}
				/>
				<ContractStatusGroupingCard
					contractStatuses={contractStatuses}
					isLoading={isLoading}
				/>
				<InboxCard inboxItems={inboxItems} />
			</div>

			<section className="grid gap-6 lg:grid-cols-3">
				<RecentProcurementCard procurementCases={procurementCases} />
				<ShortcutsCard />
			</section>
		</div>
	);
}
