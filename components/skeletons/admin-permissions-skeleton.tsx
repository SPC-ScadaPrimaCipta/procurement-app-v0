import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminPermissionsSkeleton() {
	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			{/* Header */}
			<header className="flex items-center justify-between">
				<div className="space-y-2">
					<Skeleton className="h-8 w-36" />
					<Skeleton className="h-4 w-80" />
				</div>
				<Skeleton className="h-10 w-40" />
			</header>

			{/* Table */}
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<Skeleton className="h-4 w-20" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-16" />
							</TableHead>
							<TableHead>
								<Skeleton className="h-4 w-24" />
							</TableHead>
							<TableHead className="text-right">
								<Skeleton className="h-4 w-16 ml-auto" />
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{[...Array(8)].map((_, i) => (
							<TableRow key={i}>
								<TableCell>
									<Skeleton className="h-4 w-24" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-20" />
								</TableCell>
								<TableCell>
									<Skeleton className="h-4 w-64" />
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Skeleton className="h-8 w-8" />
										<Skeleton className="h-8 w-8" />
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
