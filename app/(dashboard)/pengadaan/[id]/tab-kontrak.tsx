import { useState } from "react";
import { format } from "date-fns";
import { Briefcase, Building2, Calendar, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ContractCreateDialog } from "@/components/kontrak/contract-create-dialog";
import { ProcurementCaseDetail } from "./types";

interface TabKontrakProps {
	data: ProcurementCaseDetail;
}

export function TabKontrak({ data }: TabKontrakProps) {
	const { contract } = data;
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const router = useRouter();

	return (
		<>
			{contract ? (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<CardTitle className="text-lg flex items-center gap-2">
									<Briefcase className="w-5 h-5 text-primary" />
									Informasi Kontrak
								</CardTitle>
								<Badge variant="outline">
									{contract.contract_status?.name}
								</Badge>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-8"
								asChild
							>
								<Link href={`/kontrak/${contract.id}`}>
									<ExternalLink className="w-3.5 h-3.5 mr-2" />
									Lihat Detail
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-6">
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Nomor Kontrak
							</p>
							<p className="font-mono font-medium">
								{contract.contract_number}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Nilai Kontrak
							</p>
							<p className="font-bold text-lg text-primary">
								{new Intl.NumberFormat("id-ID", {
									style: "currency",
									currency: "IDR",
								}).format(contract.contract_value)}
							</p>
						</div>
						<div className="space-y-1 md:col-span-2">
							<p className="text-sm font-medium text-muted-foreground">
								Vendor / Penyedia
							</p>
							<div className="flex items-center gap-2 p-3 border rounded-md bg-muted/10">
								<Building2 className="w-5 h-5 text-muted-foreground" />
								<p className="font-medium">
									{contract.vendor?.vendor_name || "-"}
								</p>
							</div>
						</div>
						<div className="space-y-1">
							<p className="text-sm font-medium text-muted-foreground">
								Periode Pelaksanaan
							</p>
							<div className="flex gap-2 items-center">
								<Calendar className="w-4 h-4 text-muted-foreground" />
								<span>
									{format(
										new Date(contract.start_date),
										"dd MMM yyyy"
									)}
									{" - "}
									{format(
										new Date(contract.end_date),
										"dd MMM yyyy"
									)}
								</span>
							</div>
						</div>
						<div className="space-y-1 md:col-span-2">
							<p className="text-sm font-medium text-muted-foreground">
								Uraian Pekerjaan
							</p>
							<p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
								{contract.work_description}
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="flex flex-col items-center justify-center p-12 bg-muted/10 rounded-lg border border-dashed">
					<Briefcase className="h-8 w-8 text-muted-foreground/50 mb-3" />
					<p className="text-muted-foreground mb-4">
						Belum ada kontrak yang dibuat.
					</p>
					<Button
						variant="outline"
						onClick={() => setIsCreateDialogOpen(true)}
					>
						Buat Kontrak Baru
					</Button>
				</div>
			)}

			<ContractCreateDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				caseId={data.id}
				onSuccess={() => {
					toast.success("Kontrak berhasil dibuat");
					router.refresh();
				}}
			/>
		</>
	);
}
