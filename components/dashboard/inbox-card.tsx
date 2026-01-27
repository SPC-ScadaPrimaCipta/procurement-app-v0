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
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
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
								<CardContent className="flex items-center gap-4 rounded-lg">
									<div className="shrink-0 rounded-md bg-muted/10">
										<Mail className="w-5 h-5 text-muted-foreground" />
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-base font-medium truncate">
											{item.title}
										</p>
										<p className="text-sm text-muted-foreground truncate mt-1">
											{item.stepName} • {item.requestedBy}
										</p>
									</div>
									<div className="flex flex-col items-end ml-2 pr-4">
										<span
											className={`text-sm font-medium ${
												item.status === "PENDING"
													? "text-amber-500"
													: "text-emerald-500"
											}`}
										>
											{item.status}
										</span>
										<span className="text-sm text-muted-foreground mt-1">
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
