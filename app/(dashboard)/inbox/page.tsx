"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/datatable/data-table";
import { columns, InboxItem } from "./columns";

// Mock Data
const MOCK_INBOX_DATA: InboxItem[] = [
	{
		id: "1",
		title: "Persetujuan Pengadaan PC-2024-001",
		message: "Mohon tinjau dan setujui pengadaan Laptop Dinas.",
		type: "approval",
		reference_code: "PC-2024-001",
		from: "Budi Santoso",
		status: "unread",
		created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
		link: "/pengadaan/PC-2024-001", // Assuming routing to ID/Code works or will work. For now mock link.
	},
	{
		id: "2",
		title: "Kontrak Baru Dibuat: CTR-2024-005",
		message: "Kontrak untuk Pengadaan ATK 2024 telah berhasil dibuat.",
		type: "notification",
		reference_code: "CTR-2024-005",
		from: "System",
		status: "unread",
		created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
		link: "/kontrak",
	},
	{
		id: "3",
		title: "Revisi Dokumen Diperlukan",
		message: "Dokumen BAST tahap 1 perlu direvisi kelengkapannya.",
		type: "task",
		reference_code: "PC-2023-099",
		from: "Siti Aminah",
		status: "read",
		created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
		link: "/pengadaan",
	},
	{
		id: "4",
		title: "Surat Masuk Baru: ND-2023/XI/001",
		message: "Nota Dinas dari Bagian Umum perihal permintaan barang.",
		type: "notification",
		reference_code: "ND-2023/XI/001",
		from: "Sekretariat",
		status: "read",
		created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
		link: "/nota-dinas/surat-masuk",
	},
	{
		id: "5",
		title: "Persetujuan Pembayaran Termin 2",
		message:
			"Menunggu persetujuan pembayaran untuk kontrak Renovasi Gedung.",
		type: "approval",
		reference_code: "CTR-2023-012",
		from: "Finance Dept",
		status: "unread",
		created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
		link: "/kontrak",
	},
];

export default function InboxPage() {
	const [data] = useState<InboxItem[]>(MOCK_INBOX_DATA);

	return (
		<div className="md:p-6 space-y-6 animate-in fade-in duration-500">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">
						Kotak Masuk
					</h1>
					<p className="text-muted-foreground">
						Notifikasi, tugas, dan permintaan persetujuan Anda.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<div className="bg-muted px-3 py-1 rounded-full text-sm font-medium">
						{data.filter((i) => i.status === "unread").length} Belum
						Dibaca
					</div>
				</div>
			</div>

			{/* DataTable wrapped in Card */}
			<Card>
				<CardContent className="p-0">
					<div className="p-4">
						<DataTable
							columns={columns}
							data={data}
							filterKey="title"
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
