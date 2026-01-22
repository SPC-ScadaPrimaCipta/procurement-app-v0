import { Skeleton } from "@/components/ui/skeleton";

export function VendorSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-9 w-32" />
					<Skeleton className="h-5 w-64" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>

			{/* Search Bar */}
			<div className="flex items-center gap-4">
				<Skeleton className="h-10 flex-1 max-w-sm" />
			</div>

			{/* Data Table */}
			<div className="rounded-lg border bg-card p-6 space-y-4">
				{/* Search & Filter in Table */}
				<div className="flex items-center gap-2">
					<Skeleton className="h-10 flex-1 max-w-sm" />
					<Skeleton className="h-10 w-24" />
				</div>

				{/* Table Header */}
				<Skeleton className="h-10 w-full" />
				
				{/* Table Rows */}
				<div className="space-y-2">
					{[...Array(8)].map((_, i) => (
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
		</div>
	);
}
