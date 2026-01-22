import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function AdminUsersSkeleton() {
	return (
		<div className="space-y-6 animate-pulse">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-9 w-48" />
					<Skeleton className="h-5 w-64" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>

			{/* Search & Filters */}
			<Card>
				<CardHeader className="space-y-4">
					<div className="flex items-center gap-4">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<Skeleton className="h-10 w-32" />
					</div>
				</CardHeader>

				<CardContent>
					{/* Table */}
					<div className="space-y-3">
						{/* Table Header */}
						<div className="flex items-center gap-4 pb-3 border-b">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-20" />
						</div>
						
						{/* Table Rows */}
						{[...Array(8)].map((_, i) => (
							<div key={i} className="flex items-center gap-4 py-3">
								<div className="flex items-center gap-3 flex-1">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="space-y-2">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-48" />
									</div>
								</div>
								<Skeleton className="h-6 w-24 rounded-full" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-8 w-8" />
							</div>
						))}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between pt-4 mt-4 border-t">
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
