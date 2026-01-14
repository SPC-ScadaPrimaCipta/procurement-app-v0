"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ContractBastListProps {
	readOnly?: boolean;
}

export function ContractBastList({ readOnly = false }: ContractBastListProps) {
	return (
		<Card className="border-dashed shadow-none">
			<CardHeader className="px-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">
						Berita Acara Serah Terima (BAST)
					</CardTitle>
					{!readOnly && (
						<Button
							size="sm"
							variant="outline"
							type="button"
							onClick={() => {}} // Placeholder
						>
							<Plus className="w-3 h-3 mr-1" /> Tambah
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<p className="text-xs text-muted-foreground text-center py-4">
					Belum ada data BAST.
				</p>
			</CardContent>
		</Card>
	);
}
