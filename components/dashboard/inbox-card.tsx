"use client";

import { ArrowRight, Mail, Inbox } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InboxCardProps {
	inboxItems: any[];
}

export function InboxCard({ inboxItems }: InboxCardProps) {
	const router = useRouter();

	return (
		<Card className="lg:col-span-1 2xl:col-span-1">
			<CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
				<div>
					<CardTitle>Kotak Masuk</CardTitle>
					<CardDescription>Kotak masuk terbaru.</CardDescription>
				</div>
				<div className="p-2 bg-blue-500/10 rounded-lg">
					<Inbox className="h-6 w-6 text-blue-500" />
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				{inboxItems.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No inbox items.
					</p>
				) : (
					<>
						{inboxItems.map((item) => (
							<Card
								key={item.id}
								className="mb-3 cursor-pointer hover:bg-muted"
								onClick={() => {
									if (
										item?.refType === "PROCUREMENT_CASE" &&
										item?.refId
									)
										router.push(`/pengadaan/${item.refId}`);
								}}
								role="button"
								tabIndex={0}
							>
								<CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg">
									<div className="shrink-0 rounded-md bg-muted/10 md:p-2">
										<Mail className="w-5 h-5 text-muted-foreground" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-base font-medium truncate">
											{item.title}
										</p>
										<p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
											{item.message}
										</p>
										<p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
											{item.stepName} • {item.requestedBy}
										</p>
									</div>
									<div className="mt-2 sm:mt-0 sm:ml-auto sm:text-right shrink-0">
										<span
											className={`md:text-sm text-xs font-medium ${
												item.status === "PENDING"
													? "text-amber-500"
													: "text-emerald-500"
											}`}
										>
										{item.status}
										</span>
										<span className="text-xs md:text-sm text-muted-foreground mt-1 block">
										{item.createdAt
											? format(
												new Date(
													item.createdAt,
												),
												"dd MMM yyyy HH:mm",
											)
										: ""}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
						<div className="px-5 pb-4 flex justify-end">
							<Button
								size="sm"
								variant="outline"
								onClick={() => router.push("/inbox")}
								aria-label="Lihat detail pengadaan pertama"
								className="mt-1 cursor-pointer"
							>
								Lihat detail
								<ArrowRight className="w-4 h-4 ml-2" />
							</Button>
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
