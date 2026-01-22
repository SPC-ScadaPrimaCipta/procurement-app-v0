import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SecuritySettingsSkeleton() {
	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* Header */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-5" />
					<Skeleton className="h-6 w-24" />
				</div>
				<Skeleton className="h-4 w-96" />
			</div>

			{/* Password Change Card */}
			<Card>
				<CardHeader className="space-y-3">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-24" />
					</div>
					<Skeleton className="h-4 w-80" />
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-28" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="flex justify-end">
						<Skeleton className="h-10 w-36" />
					</div>
				</CardContent>
			</Card>

			{/* Microsoft Connection Card */}
			<Card>
				<CardHeader className="space-y-3">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-48" />
					</div>
					<Skeleton className="h-4 w-full max-w-lg" />
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="space-y-2">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-4 w-full max-w-md" />
						</div>
						<div className="flex items-center gap-4">
							<Skeleton className="h-6 w-20 rounded-full" />
							<Skeleton className="h-10 w-28" />
						</div>
					</div>
				</CardContent>
			</Card>

			{/* 2FA Card */}
			<Card>
				<CardHeader className="space-y-3">
					<div className="flex items-center gap-2">
						<Skeleton className="h-5 w-5" />
						<Skeleton className="h-6 w-56" />
					</div>
					<Skeleton className="h-4 w-80" />
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div className="space-y-2">
							<Skeleton className="h-5 w-80" />
							<Skeleton className="h-4 w-full max-w-sm" />
						</div>
						<Skeleton className="h-10 w-48" />
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
