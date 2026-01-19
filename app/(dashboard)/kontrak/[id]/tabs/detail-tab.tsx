import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

interface ContractInfoProps {
	data: {
		contract_number: string;
		contract_date: string;
		start_date: string;
		end_date: string;
		contract_status: { name: string };
		procurement_method: { name: string };
		work_description: string;
	};
}

export function ContractDetailTab({ data }: ContractInfoProps) {
	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return format(new Date(dateString), "dd MMM yyyy");
	};

	const statusVariant =
		data.contract_status.name === "Aktif" ||
		data.contract_status.name === "Active"
			? "default"
			: data.contract_status.name === "Terminated"
			? "destructive"
			: "secondary";

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Detail Kontrak</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid md:grid-cols-2 gap-6">
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Nomor Kontrak
						</p>
						<p className="font-medium">{data.contract_number}</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Tanggal Kontrak
						</p>
						<p className="font-medium">
							{formatDate(data.contract_date)}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Metode Pemilihan
						</p>
						<p className="font-medium">
							{data.procurement_method?.name || "-"}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">Status</p>
						<Badge variant={statusVariant} className="font-normal">
							{data.contract_status.name}
						</Badge>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Mulai Pelaksanaan
						</p>
						<p className="font-medium">
							{formatDate(data.start_date)}
						</p>
					</div>
					<div className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Selesai Pelaksanaan
						</p>
						<p className="font-medium">
							{formatDate(data.end_date)}
						</p>
					</div>
				</div>
				<Separator />
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						Uraian Pekerjaan
					</p>
					<div className="bg-muted/10 p-4 rounded-md border text-sm whitespace-pre-wrap leading-relaxed">
						{data.work_description}
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
