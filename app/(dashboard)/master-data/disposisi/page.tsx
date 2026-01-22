"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DispositionActionTable } from "@/components/disposition/disposition-action-table";
import { DispositionRecipientTable } from "@/components/disposition/disposition-recipient-table";
import { Route, Users } from "lucide-react";
import { DisposisiSkeleton } from "@/components/skeletons/disposisi-skeleton";

export default function DisposisiPage() {
	const [activeTab, setActiveTab] = useState("actions");
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	useEffect(() => {
		// Simulate initial page load
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	if (isInitialLoading) {
		return <DisposisiSkeleton />;
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-3xl font-bold">Master Data Disposisi</h1>
				<p className="text-muted-foreground mt-2">
					Kelola instruksi disposisi dan penerima disposisi
				</p>
			</div>

			{/* Tabs */}
			<Card>
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<div className="border-b px-6 pt-6">
						<TabsList className="grid w-full max-w-md grid-cols-2">
							<TabsTrigger value="actions" className="flex items-center gap-2">
								<Route className="h-4 w-4" />
								Instruksi Disposisi
							</TabsTrigger>
							<TabsTrigger value="recipients" className="flex items-center gap-2">
								<Users className="h-4 w-4" />
								Penerima Disposisi
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="actions" className="p-6 space-y-4">
						<DispositionActionTable />
					</TabsContent>

					<TabsContent value="recipients" className="p-6 space-y-4">
						<DispositionRecipientTable />
					</TabsContent>
				</Tabs>
			</Card>
		</div>
	);
}
