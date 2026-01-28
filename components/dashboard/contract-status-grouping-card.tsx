"use client";

import {
	PieChart,
	Pie,
	Legend,
	Cell,
	ResponsiveContainer,
	Tooltip as RechartsTooltip,
} from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import { useTheme } from "next-themes";

const COLORS = [
	"#4F46E5", // indigo
	"#10B981", // emerald
	"#EAB308", // amber
	"#F97316", // orange
	"#EF4444", // red
	"#3B82F6", // blue
	"#9333EA", // purple
	"#14B8A6", // teal
];

interface ContractStatusGroupingCardProps {
	contractStatuses: any[];
	isLoading: boolean;
}

export function ContractStatusGroupingCard({
	contractStatuses,
	isLoading,
}: ContractStatusGroupingCardProps) {
	const [activeIndex, setActiveIndex] = useState<number | null>(null);

	const onPieEnter = (_: any, index: number) => setActiveIndex(index);

	const { theme } = useTheme();

	return (
		<Card className="lg:col-span-1 2xl:col-span-1">
			<CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
				<div>
					<CardTitle>Pengelompokan Status Kontrak</CardTitle>
					<CardDescription>
						Pengelompokan status kontrak terkini
					</CardDescription>
				</div>
				<div className="p-2 bg-emerald-500/10 rounded-lg">
					<PieChartIcon className="h-6 w-6 text-emerald-500" />
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{isLoading ? (
					<p className="text-sm text-muted-foreground p-4">
						Loading...
					</p>
					) : (
						<div className="w-full">
							<div className="grid grid-cols-1 gap-4 items-center">
								<div className="flex items-center justify-center">
									<div className="w-full h-44 sm:h-56 md:h-72">
										{(!contractStatuses || contractStatuses.length === 0 || contractStatuses.reduce((s, c) => s + (c.count || 0), 0) === 0) ? (
											<p className="text-sm text-muted-foreground p-4">No data to display.</p>
										) : (
											<ResponsiveContainer width="100%" height="100%">
												<PieChart data={contractStatuses} margin={{ top: 5, bottom: 5, left: 0, right: 0 }}>
													<RechartsTooltip contentStyle={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.2)", color: "white" }} itemStyle={{ color: "white" }} labelStyle={{ color: "white" }} />
													<Pie data={contractStatuses} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} onMouseEnter={onPieEnter} onMouseLeave={() => setActiveIndex(null)}>
														{contractStatuses.map((entry, index) => (
															<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
														))}
													</Pie>
												</PieChart>
											</ResponsiveContainer>
											)}
									</div>
								</div>
								<div className="flex flex-wrap items-center md:items-start gap-3 justify-center md:justify-center">
									{contractStatuses.map((entry, index) => (
										<div key={entry.name} className="flex items-center gap-2">
											<span className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
											<span className={`${theme === "dark" ? "text-white" : "text-black"} text-sm`}>{entry.name}</span>
										</div>
									))}
								</div>
							</div>
						</div>
				)}
			</CardContent>
		</Card>
	);
}
