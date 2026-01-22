import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TaskListSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			{/* Sub Tabs */}
			<div className="flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-fit">
				<Skeleton className="h-8 w-24 rounded-sm" />
				<Skeleton className="h-8 w-24 rounded-sm ml-1" />
			</div>

			{/* Card Content */}
			<Card>
				<CardHeader className="space-y-2">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-80" />
				</CardHeader>
				<CardContent className="p-4 space-y-3">
					{/* Table Header */}
					<Skeleton className="h-10 w-full" />
					
					{/* Table Rows */}
					{[...Array(5)].map((_, i) => (
						<Skeleton key={i} className="h-16 w-full rounded-md" />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
