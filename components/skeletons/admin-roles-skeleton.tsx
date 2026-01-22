import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminRolesSkeleton() {
	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* Header */}
			<header className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-32" />
			</header>

			{/* Grid of Role Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{[...Array(6)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4 rounded" />
						</CardHeader>
						<CardContent className="space-y-3">
							<Skeleton className="h-8 w-12" />
							<Skeleton className="h-3 w-28" />
							<div className="space-y-2 min-h-10">
								<Skeleton className="h-3 w-full" />
								<Skeleton className="h-3 w-4/5" />
							</div>
							<div className="flex justify-end gap-2 pt-1">
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
