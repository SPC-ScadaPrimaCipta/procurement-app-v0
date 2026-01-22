import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkflowManageSkeleton() {
	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-300">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-96" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>

			{/* Card with Table */}
			<Card>
				<CardContent className="pt-6 space-y-4">
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
									<Skeleton className="h-4 w-48" />
									<Skeleton className="h-3 w-full max-w-md" />
								</div>
								<Skeleton className="h-6 w-16 rounded-full" />
								<Skeleton className="h-4 w-20" />
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
