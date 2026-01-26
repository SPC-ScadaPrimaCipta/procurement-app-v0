"use client";

import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from "recharts";
import { useTheme } from "next-themes";

type ChartData = {
	name: string;
	value: number;
};

// Professional color palette - organized by category
const COLORS = {
	primary: ["#3b82f6", "#2563eb", "#1d4ed8", "#60a5fa", "#93c5fd"],
	success: ["#10b981", "#059669", "#047857", "#34d399", "#6ee7b7"],
	warning: ["#f59e0b", "#d97706", "#b45309", "#fbbf24", "#fcd34d"],
	purple: ["#8b5cf6", "#7c3aed", "#6d28d9", "#a78bfa", "#c4b5fd"],
	pink: ["#ec4899", "#db2777", "#be185d", "#f472b6", "#f9a8d4"],
	orange: ["#f97316", "#ea580c", "#c2410c", "#fb923c", "#fdba74"],
};

// Gradient colors for bar chart - more vibrant and distinct
const BAR_COLORS = [
	{ main: "#3b82f6", light: "#60a5fa" }, // blue
	{ main: "#8b5cf6", light: "#a78bfa" }, // purple
	{ main: "#ec4899", light: "#f472b6" }, // pink
	{ main: "#f59e0b", light: "#fbbf24" }, // amber
	{ main: "#10b981", light: "#34d399" }, // emerald
	{ main: "#06b6d4", light: "#22d3ee" }, // cyan
	{ main: "#6366f1", light: "#818cf8" }, // indigo
	{ main: "#f97316", light: "#fb923c" }, // orange
	{ main: "#14b8a6", light: "#2dd4bf" }, // teal
	{ main: "#a855f7", light: "#c084fc" }, // violet
];

export default function ReportPage() {
	const [kontrakByStatus, setKontrakByStatus] = useState<ChartData[]>([]);
	const [nonKontrakByStatus, setNonKontrakByStatus] = useState<ChartData[]>([]);
	const [kontrakByExpense, setKontrakByExpense] = useState<ChartData[]>([]);
	const [vendorByType, setVendorByType] = useState<ChartData[]>([]);
	const [picKontrak, setPicKontrak] = useState<ChartData[]>([]);
	const [workflowApproval, setWorkflowApproval] = useState<ChartData[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchData() {
			try {
				const [kontrakStatus, nonKontrakStatus, kontrakExpense, vendor, pic, workflow] = await Promise.all([
					fetch("/api/reports/charts?type=kontrak-by-status").then((r) => r.json()),
					fetch("/api/reports/charts?type=non-kontrak-by-status").then((r) => r.json()),
					fetch("/api/reports/charts?type=kontrak-by-expense").then((r) => r.json()),
					fetch("/api/reports/charts?type=vendor-by-type").then((r) => r.json()),
					fetch("/api/reports/charts?type=pic-kontrak").then((r) => r.json()),
					fetch("/api/reports/charts?type=workflow-approval").then((r) => r.json()),
				]);

				setKontrakByStatus(kontrakStatus);
				setNonKontrakByStatus(nonKontrakStatus);
				setKontrakByExpense(kontrakExpense);
				setVendorByType(vendor);
				setPicKontrak(pic);
				setWorkflowApproval(workflow);
			} catch (error) {
				console.error("Error fetching chart data:", error);
			} finally {
				setLoading(false);
			}
		}

		fetchData();
	}, []);

	if (loading) {
		return (
			<div className="p-6">
				<div className="flex items-center justify-center h-[60vh]">
					<div className="text-muted-foreground">Loading charts...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 space-y-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold tracking-tight">Report & Analytics</h1>
				<p className="text-muted-foreground mt-2 text-sm">
					Visualisasi data dan statistik sistem procurement
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{/* Kontrak berdasarkan Status */}
				<ChartCard title="Kontrak berdasarkan Status" subtitle="Total kontrak per status">
					<DonutChart data={kontrakByStatus} colors={COLORS.primary} />
				</ChartCard>

				{/* Non Kontrak berdasarkan Status */}
				<ChartCard title="Non Kontrak berdasarkan Status" subtitle="Total case tanpa kontrak">
					<DonutChart data={nonKontrakByStatus} colors={COLORS.success} />
				</ChartCard>

				{/* Kontrak berdasarkan Jenis Belanja */}
				<ChartCard title="Kontrak berdasarkan Jenis Belanja" subtitle="Kategori belanja">
					<DonutChart data={kontrakByExpense} colors={COLORS.warning} />
				</ChartCard>

				{/* Vendor berdasarkan Jenis */}
				<ChartCard title="Vendor berdasarkan Jenis" subtitle="Tipe supplier">
					<DonutChart data={vendorByType} colors={COLORS.purple} />
				</ChartCard>

				{/* Workflow Approval */}
				<ChartCard title="Workflow Approval Status" subtitle="Status persetujuan workflow">
					<DonutChart data={workflowApproval} colors={COLORS.pink} />
				</ChartCard>

				{/* PIC Kontrak - Full Width */}
				<ChartCard 
					title="Jumlah Kontrak per PIC" 
					subtitle="Top 10 PIC dengan kontrak terbanyak"
					className="md:col-span-2 lg:col-span-3"
				>
					<HorizontalBarChart data={picKontrak} />
				</ChartCard>
			</div>
		</div>
	);
}

function ChartCard({ 
	title, 
	subtitle, 
	children, 
	className = "" 
}: { 
	title: string; 
	subtitle?: string;
	children: React.ReactNode; 
	className?: string 
}) {
	return (
		<div className={`group border rounded-xl p-6 bg-card hover:shadow-xl hover:border-primary/20 transition-all duration-300 ${className}`}>
			<div className="mb-6">
				<h3 className="text-lg font-semibold tracking-tight">{title}</h3>
				{subtitle && (
					<p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
				)}
			</div>
			{children}
		</div>
	);
}

// Active shape for pie chart hover effect
const renderActiveShape = (props: any, colors: string[], isDark: boolean) => {
	const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

	return (
		<g>
			<text 
				x={cx} 
				y={cy - 15} 
				textAnchor="middle" 
				fill={isDark ? "#f3f4f6" : "#111827"} 
				className="font-bold text-base"
			>
				{payload.name}
			</text>
			<text 
				x={cx} 
				y={cy + 5} 
				textAnchor="middle" 
				fill={isDark ? "#9ca3af" : "#6b7280"} 
				className="text-2xl font-bold"
			>
				{value}
			</text>
			<text 
				x={cx} 
				y={cy + 25} 
				textAnchor="middle" 
				fill={isDark ? "#6b7280" : "#9ca3af"} 
				className="text-xs"
			>
				({(percent * 100).toFixed(1)}%)
			</text>
			<Sector
				cx={cx}
				cy={cy}
				innerRadius={innerRadius}
				outerRadius={outerRadius + 8}
				startAngle={startAngle}
				endAngle={endAngle}
				fill={fill}
			/>
			<Sector
				cx={cx}
				cy={cy}
				startAngle={startAngle}
				endAngle={endAngle}
				innerRadius={outerRadius + 10}
				outerRadius={outerRadius + 14}
				fill={fill}
				opacity={0.6}
			/>
		</g>
	);
};

function DonutChart({ data, colors }: { data: ChartData[]; colors: string[] }) {
	const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
	const { theme, systemTheme } = useTheme();
	const currentTheme = theme === "system" ? systemTheme : theme;
	const isDark = currentTheme === "dark";
	const hasData = data && data.length > 0;

	if (!hasData) {
		return (
			<div className="h-[300px] flex items-center justify-center">
				<div className="text-center">
					<div className="text-muted-foreground text-sm">Tidak ada data</div>
				</div>
			</div>
		);
	}

	const totalValue = data.reduce((sum, item) => sum + item.value, 0);

	return (
		<ResponsiveContainer width="100%" height={320}>
			<PieChart>
				<Pie
					activeShape={(props: any) => renderActiveShape(props, colors, isDark)}
					data={data}
					cx="50%"
					cy="50%"
					innerRadius={70}
					outerRadius={100}
					paddingAngle={3}
					dataKey="value"
					onMouseEnter={(_, index) => setActiveIndex(index)}
					onMouseLeave={() => setActiveIndex(undefined)}
					animationBegin={0}
					animationDuration={600}
					animationEasing="ease-in-out"
				>
					{data.map((entry, index) => (
						<Cell 
							key={`cell-${index}`} 
							fill={colors[index % colors.length]}
							className="transition-all duration-300 cursor-pointer outline-none"
							strokeWidth={activeIndex === index ? 2 : 0}
							stroke={isDark ? "#1f2937" : "#ffffff"}
						/>
					))}
				</Pie>
				<Tooltip
					contentStyle={{
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
						border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
						borderRadius: "8px",
						padding: "12px 16px",
						boxShadow: isDark ? "0 10px 15px -3px rgba(0, 0, 0, 0.3)" : "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
					}}
					formatter={(value: number | undefined) => [
						<span key="value" className="font-semibold">{value ?? 0}</span>,
						"Jumlah"
					]}
					labelStyle={{ 
						fontWeight: "600", 
						marginBottom: "4px",
						color: isDark ? "#f3f4f6" : "#111827"
					}}
				/>
				<Legend
					verticalAlign="bottom"
					height={36}
					iconType="circle"
					iconSize={8}
					wrapperStyle={{
						fontSize: "11px",
						paddingTop: "20px",
						color: isDark ? "#d1d5db" : "#6b7280",
					}}
					formatter={(value, entry: any) => {
						const percentage = ((entry.payload.value / totalValue) * 100).toFixed(1);
						return `${value} (${percentage}%)`;
					}}
				/>
			</PieChart>
		</ResponsiveContainer>
	);
}

function HorizontalBarChart({ data }: { data: ChartData[] }) {
	const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);
	const { theme, systemTheme } = useTheme();
	const currentTheme = theme === "system" ? systemTheme : theme;
	const isDark = currentTheme === "dark";
	const hasData = data && data.length > 0;

	if (!hasData) {
		return (
			<div className="h-[400px] flex items-center justify-center">
				<div className="text-center">
					<div className="text-muted-foreground text-sm">Tidak ada data</div>
				</div>
			</div>
		);
	}

	return (
		<ResponsiveContainer width="100%" height={Math.max(350, data.length * 50)}>
			<BarChart 
				data={data} 
				layout="vertical" 
				margin={{ top: 10, right: 40, left: 120, bottom: 10 }}
				onMouseMove={(state) => {
					if (state.isTooltipActive && typeof state.activeTooltipIndex === 'number') {
						setActiveIndex(state.activeTooltipIndex);
					} else {
						setActiveIndex(undefined);
					}
				}}
				onMouseLeave={() => setActiveIndex(undefined)}
			>
				<defs>
					{BAR_COLORS.map((color, index) => (
						<linearGradient key={`gradient-${index}`} id={`barGradient${index}`} x1="0" y1="0" x2="1" y2="0">
							<stop offset="0%" stopColor={color.light} stopOpacity={0.9} />
							<stop offset="100%" stopColor={color.main} stopOpacity={1} />
						</linearGradient>
					))}
				</defs>
				<CartesianGrid 
					strokeDasharray="3 3" 
					stroke={isDark ? "#374151" : "#e5e7eb"} 
					opacity={0.3}
					horizontal={true}
					vertical={false}
				/>
				<XAxis 
					type="number" 
					stroke={isDark ? "#9ca3af" : "#6b7280"}
					style={{ fontSize: "12px", fontWeight: "500" }}
					tickLine={false}
					axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
				/>
				<YAxis 
					dataKey="name" 
					type="category" 
					stroke={isDark ? "#9ca3af" : "#6b7280"} 
					width={110}
					style={{ fontSize: "12px", fontWeight: "500" }}
					tickLine={false}
					axisLine={{ stroke: isDark ? "#4b5563" : "#d1d5db" }}
				/>
				<Tooltip
					contentStyle={{
						backgroundColor: isDark ? "#1f2937" : "#ffffff",
						border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
						borderRadius: "10px",
						padding: "12px 16px",
						boxShadow: isDark 
							? "0 20px 25px -5px rgba(0, 0, 0, 0.4)" 
							: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
					}}
					formatter={(value: number | undefined) => [
						<span key="value" className="font-bold text-lg">{value ?? 0}</span>,
						<span key="label" className="text-xs opacity-75">kontrak</span>
					]}
					labelStyle={{ 
						fontWeight: "600", 
						marginBottom: "8px",
						fontSize: "14px",
						color: isDark ? "#f3f4f6" : "#111827"
					}}
					cursor={{ 
						fill: isDark ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)", 
						radius: 8 
					}}
				/>
				<Bar 
					dataKey="value" 
					radius={[0, 8, 8, 0]}
					animationBegin={0}
					animationDuration={600}
					animationEasing="ease-out"
					maxBarSize={45}
				>
					{data.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={
								activeIndex === index 
									? BAR_COLORS[index % BAR_COLORS.length].main
									: `url(#barGradient${index % BAR_COLORS.length})`
							}
							className="transition-all duration-200 cursor-pointer"
							opacity={activeIndex === undefined ? 1 : activeIndex === index ? 1 : 0.5}
						/>
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}
