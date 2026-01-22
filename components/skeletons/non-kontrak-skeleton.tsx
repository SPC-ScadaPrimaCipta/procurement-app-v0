import { Skeleton } from "@/components/ui/skeleton";

export function NonKontrakSkeleton() {
	return (
		<div className="flex h-screen overflow-hidden animate-pulse">
			{/* Sidebar */}
			<aside className="w-64 border-r bg-background p-4">
				<Skeleton className="h-6 w-40 mb-4" />
				
				<div className="space-y-4">
					<div>
						<Skeleton className="h-4 w-24 mb-2" />
						<Skeleton className="h-10 w-full rounded-md" />
					</div>
					<Skeleton className="h-10 w-full rounded-md" />
				</div>
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-hidden flex flex-col">
				{/* Header */}
				<div className="p-6 border-b space-y-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<Skeleton className="h-10 w-10 rounded-md" />
							<div className="space-y-2">
								<Skeleton className="h-8 w-32" />
								<Skeleton className="h-4 w-64" />
							</div>
						</div>
						<Skeleton className="h-10 w-32" />
					</div>

					{/* Search Bar */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-10 flex-1 max-w-sm" />
						<Skeleton className="h-10 w-20" />
					</div>
				</div>

				{/* Table Content */}
				<div className="flex-1 overflow-auto p-6">
					<div className="space-y-3">
						{/* Table Header */}
						<Skeleton className="h-10 w-full" />
						
						{/* Table Rows */}
						{[...Array(8)].map((_, i) => (
							<Skeleton key={i} className="h-16 w-full" />
						))}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between mt-4">
						<Skeleton className="h-4 w-48" />
						<div className="flex items-center gap-2">
							<Skeleton className="h-8 w-20" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-20" />
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
