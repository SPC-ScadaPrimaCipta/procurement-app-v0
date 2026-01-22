import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkflowRequestsSkeleton() {
	return (
		<div className="space-y-8 animate-in fade-in duration-300">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div className="space-y-2">
					<Skeleton className="h-8 w-36" />
					<Skeleton className="h-4 w-80" />
				</div>
				<Skeleton className="h-10 w-36" />
			</div>

			{/* Card with Table */}
			<Card>
				<CardHeader className="space-y-2">
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Search and Filter */}
					<div className="flex items-center gap-2">
						<Skeleton className="h-10 flex-1" />
						<Skeleton className="h-10 w-24" />
					</div>

					{/* Table */}
					<div className="space-y-3">
						{[...Array(6)].map((_, i) => (
							<div
								key={i}
								className="flex items-center gap-4 py-3 border-b last:border-0"
							>
								<Skeleton className="h-4 w-8" />
								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-full max-w-md" />
									<Skeleton className="h-3 w-32" />
								</div>
								<Skeleton className="h-6 w-20 rounded-full" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-8 w-24" />
							</div>
						))}
					</div>

					{/* Pagination */}
					<div className="flex items-center justify-between">
						<Skeleton className="h-4 w-32" />
						<div className="flex gap-2">
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
							<Skeleton className="h-8 w-8" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
