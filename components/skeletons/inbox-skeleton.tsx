import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function InboxSkeleton() {
	return (
		<div className="md:p-6 space-y-6 animate-pulse">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-32" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>

			{/* Main Tabs (Tasks & Notifications) */}
			<div className="space-y-6">
				<div className="flex items-center">
					<div className="flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground max-w-[400px] w-full">
						<Skeleton className="h-8 flex-1 rounded-sm" />
						<Skeleton className="h-8 flex-1 rounded-sm ml-1" />
					</div>
				</div>

				{/* Sub Tabs (Pending & History / Unread & All) */}
				<div className="flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-fit">
					<Skeleton className="h-8 w-24 rounded-sm" />
					<Skeleton className="h-8 w-24 rounded-sm ml-1" />
				</div>

				{/* Content Card */}
				<Card>
					<CardHeader className="space-y-2">
						<Skeleton className="h-6 w-48" />
						<Skeleton className="h-4 w-80" />
					</CardHeader>
					<CardContent className="p-4 space-y-4">
						{/* Table/List Items */}
						<div className="space-y-3">
							{[...Array(5)].map((_, i) => (
								<div
									key={i}
									className="flex items-start gap-4 p-4 border rounded-lg"
								>
									<Skeleton className="h-2.5 w-2.5 rounded-full mt-2" />
									<div className="flex-1 space-y-2">
										<div className="flex items-center justify-between gap-2">
											<Skeleton className="h-4 w-2/3" />
											<Skeleton className="h-3 w-20" />
										</div>
										<Skeleton className="h-3 w-full" />
										<Skeleton className="h-3 w-4/5" />
									</div>
									<div className="flex gap-1">
										<Skeleton className="h-8 w-8 rounded-md" />
										<Skeleton className="h-8 w-8 rounded-md" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
