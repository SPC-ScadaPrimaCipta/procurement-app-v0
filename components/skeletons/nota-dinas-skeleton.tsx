import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function NotaDinasSkeleton() {
	return (
		<div className="md:p-6 space-y-6 animate-pulse">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<Skeleton className="h-10 w-48" />
			</div>

			{/* Stat Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				{[...Array(3)].map((_, i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="flex items-center justify-between">
								<div className="space-y-2 flex-1">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-8 w-16" />
								</div>
								<Skeleton className="h-12 w-12 rounded-lg" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* DataTable Card */}
			<Card>
				<CardContent className="p-0">
					<div className="p-4 space-y-4">
						{/* Search & Filter Bar */}
						<div className="flex items-center gap-2">
							<Skeleton className="h-10 flex-1 max-w-sm" />
							<Skeleton className="h-10 w-24" />
						</div>

						{/* Table */}
						<div className="space-y-2">
							{/* Table Header */}
							<Skeleton className="h-10 w-full" />
							
							{/* Table Rows */}
							{[...Array(8)].map((_, i) => (
								<Skeleton key={i} className="h-16 w-full" />
							))}
						</div>

						{/* Pagination */}
						<div className="flex items-center justify-between">
							<Skeleton className="h-4 w-48" />
							<div className="flex items-center gap-2">
								<Skeleton className="h-8 w-20" />
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-20" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
