import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function MasterDataTableSkeleton() {
	return (
		<div className="md:p-6 space-y-6 animate-pulse">
			{/* Header */}
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-5 w-96" />
			</div>

			{/* Content Card */}
			<Card>
				<CardContent className="p-6 space-y-4">
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
				</CardContent>
			</Card>
		</div>
	);
}
