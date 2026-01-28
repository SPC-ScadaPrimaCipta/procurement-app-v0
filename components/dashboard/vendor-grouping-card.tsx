"use client";

import {
	BarChart,
	CartesianGrid,
	XAxis,
	YAxis,
	Tooltip as RechartsTooltip,
	Bar,
	ResponsiveContainer,
} from "recharts";
import React from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { useTheme } from "next-themes";

interface VendorGroupingCardProps {
	vendorTrend: { label: string; value: number }[];
	isLoading: boolean;
}

export function VendorGroupingCard({
	vendorTrend,
	isLoading,
}: VendorGroupingCardProps) {
	const { theme } = useTheme();
    
	const CustomizedAxisTick = ({ x, y, payload }: any) => {
		const fill = theme === "dark" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)";
		return (
			<text
				x={x}
				y={y + 12}
				textAnchor="middle"
				style={{ fill }}
				className="hidden sm:block text-xs"
			>
				{String(payload.value)}
			</text>
		);
	};
	return (
		<Card className="lg:col-span-2 2xl:col-span-2">
			<CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
				<div>
					<CardTitle>Pengelompokan Penyedia</CardTitle>
					<CardDescription>
						Dikelompokan berdasarkan jenis penyedia
					</CardDescription>
				</div>
				<div className="p-2 bg-indigo-500/10 rounded-lg">
					<Building2 className="h-6 w-6 text-indigo-500" />
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className="text-sm text-muted-foreground">Loading...</p>
				) : (
					<div className="w-full h-56 sm:h-72 md:h-96">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart
								data={[...vendorTrend].sort(
									(a, b) => a.value - b.value,
								)}
								responsive
								margin={{
									top: 5,
									bottom: 5,
									left: 0,
									right: 0,
								}}
							>
								<CartesianGrid
									// stroke="rgba(255,255,255,0.2)"
									stroke={`${theme === "dark" ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}`}
									strokeDasharray="3 3"
								/>
								<XAxis
									dataKey="label"
									interval={0}
									tickFormatter={(value) =>
										value.length > 10 ? `${value.substring(0, 10)}...` : value
									}
									stroke={`${theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"}`}
									tick={<CustomizedAxisTick />}
								/>
								<YAxis
									stroke={`${theme === "dark" ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)"}`}
									tick={{
										fill: `${theme === "dark" ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.8)"}`,
										fontSize: 12,
									}}
								/>
								<RechartsTooltip
									contentStyle={{
										background: `${theme === "dark" ? "#1e1e1e" : "#ffffff"}`,
										border: `${theme === "dark" ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(0,0,0,0.2)"}`,
										color: `${theme === "dark" ? "white" : "black"}`,
									}}
								/>
								<Bar
									dataKey="value"
									fill="#4F46E5"
									radius={[10, 10, 0, 0]}
								/>{" "}
								{/* indigo/primary */}
							</BarChart>
						</ResponsiveContainer>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
