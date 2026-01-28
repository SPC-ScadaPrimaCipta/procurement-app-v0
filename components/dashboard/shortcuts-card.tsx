"use client";

import { useRouter } from "next/navigation";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutGrid } from "lucide-react";

export function ShortcutsCard() {
	const router = useRouter();

	return (
		<Card className="lg:col-span-2 2xl:col-span-1">
			<CardHeader className="flex flex-row items-center justify-between">
				<div>
					<CardTitle>Pintasan</CardTitle>
					<CardDescription>
						Akses cepat ke tindakan umum
					</CardDescription>
				</div>
				<div className="p-2 bg-purple-500/10 rounded-lg">
					<LayoutGrid className="h-6 w-6 text-purple-500" />
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={() => router.push("/nota-dinas/surat-masuk/new")}
				>
					Buat Surat Masuk Baru
				</Button>
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={() => router.push("/admin/roles")}
				>
					Tetapkan Peran Pada Pengguna
				</Button>
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={() => router.push("/admin/permissions")}
				>
					Buat Perizinan Baru
				</Button>
				<Button
					className="w-full justify-start"
					variant="outline"
					onClick={() => router.push("/workflow/manage")}
				>
					Membuat Alur Kerja Baru
				</Button>
			</CardContent>
		</Card>
	);
}
