import { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardMetricCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	className?: string;
	iconClassName?: string;
}

export function DashboardMetricCard({
	title,
	value,
	icon: Icon,
	description,
	className,
	iconClassName,
}: DashboardMetricCardProps) {
	return (
		<Card className={cn("relative overflow-hidden", className)}>
			<CardHeader className="pb-2 relative z-10">
				<CardTitle className="text-sm font-medium text-muted-foreground">
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent className="relative z-10">
				<div className="text-2xl font-bold">{value}</div>
				{description && (
					<p className="text-xs text-muted-foreground mt-1">
						{description}
					</p>
				)}
			</CardContent>
			<Icon
				className={cn(
					"absolute -right-4 -bottom-4 h-24 w-24 stroke-1",
					iconClassName || "text-muted-foreground/10",
				)}
			/>
		</Card>
	);
}
