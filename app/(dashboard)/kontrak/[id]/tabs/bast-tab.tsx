import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";

interface BastTabProps {
	bast: Array<{
		id: string;
		bast_type: string;
		bast_number: string;
		bast_date: string;
		progress_percent: number;
		notes: string;
		document: Array<{
			file_url?: string;
			file_name?: string;
		}>;
	}>;
}

export function BastTab({ bast }: BastTabProps) {
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return format(new Date(dateString), "dd MMM yyyy");
	};

	const handleDownload = (url: string) => {
		window.open(url, "_blank");
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">
					Berita Acara Serah Terima (BAST)
				</CardTitle>
				<CardDescription>
					Riwayat serah terima pekerjaan
				</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>No. BAST</TableHead>
							<TableHead>Tanggal</TableHead>
							<TableHead>Tipe</TableHead>
							<TableHead className="text-right">
								Progress
							</TableHead>
							<TableHead className="w-[100px]"></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{bast.map((item) => {
							const docUrl = item.document?.[0]?.file_url;
							return (
								<TableRow key={item.id}>
									<TableCell className="font-medium">
										{item.bast_number || "-"}
									</TableCell>
									<TableCell>
										{formatDate(item.bast_date)}
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{item.bast_type}
										</Badge>
									</TableCell>
									<TableCell className="text-right font-medium">
										{item.progress_percent}%
									</TableCell>
									<TableCell>
										{docUrl && (
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													handleDownload(docUrl)
												}
												title="Download BAST"
											>
												<Download className="h-4 w-4 text-muted-foreground" />
											</Button>
										)}
									</TableCell>
								</TableRow>
							);
						})}
						{bast.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center py-8 text-muted-foreground"
								>
									Belum ada data BAST.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
