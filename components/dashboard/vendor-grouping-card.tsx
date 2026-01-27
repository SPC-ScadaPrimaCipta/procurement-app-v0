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
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface VendorGroupingCardProps {
	vendorTrend: { label: string; value: number }[];
	isLoading: boolean;
}

export function VendorGroupingCard({
	vendorTrend,
	isLoading,
}: VendorGroupingCardProps) {
	return (
		<Card className="lg:col-span-2">
			<CardHeader className="flex flex-row items-center justify-between">
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
					<div className="w-full h-96">
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
									stroke="rgba(255,255,255,0.2)"
									strokeDasharray="3 3"
								/>
								<XAxis
									dataKey="label"
									stroke="rgba(255,255,255,0.6)"
									tick={{
										fill: "rgba(255,255,255,0.8)",
										fontSize: 12,
									}}
								/>
								<YAxis
									stroke="rgba(255,255,255,0.6)"
									tick={{
										fill: "rgba(255,255,255,0.8)",
										fontSize: 12,
									}}
								/>
								<RechartsTooltip
									contentStyle={{
										background: "#1e1e1e",
										border: "1px solid rgba(255,255,255,0.2)",
										color: "white",
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
