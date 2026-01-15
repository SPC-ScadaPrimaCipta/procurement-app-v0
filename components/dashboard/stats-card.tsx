import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	className?: string;
	iconClassName?: string;
	iconContainerClassName?: string;
}

export function StatsCard({
	title,
	value,
	icon: Icon,
	className,
	iconClassName,
	iconContainerClassName,
}: StatsCardProps) {
	return (
		<Card className={className}>
			<CardContent className="p-6 flex items-center gap-4">
				<div className={cn("p-3 rounded-full", iconContainerClassName)}>
					<Icon className={cn("h-6 w-6", iconClassName)} />
				</div>
				<div>
					<p className="text-sm font-medium text-muted-foreground">
						{title}
					</p>
					<h3 className="text-2xl font-bold">{value}</h3>
				</div>
			</CardContent>
		</Card>
	);
}
