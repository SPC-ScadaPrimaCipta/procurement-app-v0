import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function DisposisiSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Tabs Card */}
			<Card>
				<div className="border-b px-6 pt-6">
					{/* Tab Triggers */}
					<div className="flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full max-w-md">
						<Skeleton className="h-8 flex-1 rounded-sm" />
						<Skeleton className="h-8 flex-1 rounded-sm ml-1" />
					</div>
				</div>

				{/* Tab Content */}
				<div className="p-6 space-y-4">
					{/* Action Buttons */}
					<div className="flex items-center justify-between">
						<Skeleton className="h-10 w-40" />
						<Skeleton className="h-10 w-32" />
					</div>

					{/* Search Bar */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-10 flex-1 max-w-sm" />
					</div>

					{/* Table */}
					<div className="space-y-3">
						{/* Table Header */}
						<Skeleton className="h-10 w-full" />
						
						{/* Table Rows */}
						{[...Array(6)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between pt-4">
						<Skeleton className="h-4 w-48" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-20" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-20" />
						</div>
					</div>
				</div>
			</Card>
		</div>
	);
}
