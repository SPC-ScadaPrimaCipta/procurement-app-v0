import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
	return (
		<div className="space-y-8 animate-pulse">
			{/* Header */}
			<header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-48" />
					<Skeleton className="h-4 w-96" />
				</div>
				<div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
				</div>
			</header>

			{/* Stat Cards */}
			<section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{[...Array(4)].map((_, i) => (
					<Card key={i}>
						<CardHeader className="space-y-2">
							<Skeleton className="h-4 w-1/2" />
							<Skeleton className="h-8 w-1/3" />
						</CardHeader>
					</Card>
				))}
			</section>

			{/* Middle Section: Chart & Inbox */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Chart Skeleton */}
				<Card className="lg:col-span-2">
					<CardHeader className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-64" />
					</CardHeader>
					<CardContent>
						<Skeleton className="w-full h-96 rounded-lg" />
					</CardContent>
				</Card>

				{/* Inbox Skeleton */}
				<Card>
					<CardHeader className="space-y-2">
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent className="space-y-4">
						{[...Array(3)].map((_, i) => (
							<div
								key={i}
								className="flex gap-4 p-4 border rounded-lg"
							>
								<Skeleton className="h-10 w-10 rounded-md" />
								<div className="space-y-2 flex-1">
									<Skeleton className="h-4 w-full" />
									<Skeleton className="h-3 w-2/3" />
								</div>
							</div>
						))}
						<div className="flex justify-end pt-2">
							<Skeleton className="h-8 w-24" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Bottom Section: Table & Shortcuts */}
			<section className="grid gap-6 lg:grid-cols-3">
				{/* Table Skeleton */}
				<Card className="lg:col-span-2">
					<CardHeader>
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Skeleton className="h-10 w-full" /> {/* Header */}
							{[...Array(5)].map((_, i) => (
								<Skeleton key={i} className="h-12 w-full" />
							))}
						</div>
					</CardContent>
				</Card>

				{/* Shortcuts Skeleton */}
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-32" />
						<Skeleton className="h-4 w-48" />
					</CardHeader>
					<CardContent className="space-y-3">
						{[...Array(4)].map((_, i) => (
							<Skeleton key={i} className="h-10 w-full" />
						))}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
