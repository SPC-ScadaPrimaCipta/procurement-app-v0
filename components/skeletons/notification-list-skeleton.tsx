import { Skeleton } from "@/components/ui/skeleton";

export function NotificationListSkeleton() {
	return (
		<div className="space-y-4 animate-pulse">
			{/* Sub Tabs */}
			<div className="flex h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-fit">
				<Skeleton className="h-8 w-24 rounded-sm" />
				<Skeleton className="h-8 w-20 rounded-sm ml-1" />
			</div>

			{/* Notification Items */}
			<div className="space-y-2">
				{[...Array(6)].map((_, i) => (
					<div
						key={i}
						className="flex items-start gap-4 p-4 border rounded-lg"
					>
						<Skeleton className="h-2.5 w-2.5 rounded-full mt-2 shrink-0" />
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
		</div>
	);
}
