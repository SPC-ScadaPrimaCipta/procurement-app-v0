import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { formatIDR } from "@/lib/utils";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { CreateBastDialog } from "./create-bast-dialog";
import { Button } from "@/components/ui/button";

interface PaymentPlanProps {
	contractId: string;
	contract_payment_plan: Array<{
		id: string;
		line_no: number;
		payment_method: string;
		line_amount: number;
		planned_date: string | null;
		notes: string | null;
		bast: Array<{
			id: string;
			bast_number: string;
			bast_date: string;
			progress_percent: number;
			notes: string;
			document: {
				file_url?: string;
				file_name?: string;
			} | null;
		}>;
	}>;
}

export function PaymentPlanTab({
	contractId,
	contract_payment_plan,
}: PaymentPlanProps) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<any>(null);

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "-";
		return format(new Date(dateString), "dd MMM yyyy");
	};

	const handleOpenDialog = (plan: any) => {
		setSelectedPlan(plan);
		setIsOpen(true);
	};

	const handleViewBast = (url: string) => {
		window.open(url, "_blank");
	};

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						Rencana & Jadwal Pembayaran
					</CardTitle>
					<CardDescription>
						Jadwal pembayaran yang disepakati dalam kontrak
					</CardDescription>
				</CardHeader>
				<CardContent className="p-0">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-20">Tahap</TableHead>
								<TableHead>Metode</TableHead>
								<TableHead>Tanggal Rencana</TableHead>
								<TableHead className="text-right">
									Nilai (IDR)
								</TableHead>
								<TableHead className="w-[150px]"></TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{contract_payment_plan.map((item) => {
								const hasBast =
									item.bast && item.bast.length > 0;
								const bastDocUrl = hasBast
									? item.bast[0].document?.file_url
									: null;

								return (
									<TableRow key={item.id}>
										<TableCell className="font-medium text-center">
											{item.line_no}
										</TableCell>
										<TableCell>
											{item.payment_method}
										</TableCell>
										<TableCell>
											{formatDate(item.planned_date)}
										</TableCell>
										<TableCell className="text-right font-medium">
											{formatIDR(
												Number(item.line_amount),
											)}
										</TableCell>
										<TableCell>
											{hasBast ? (
												<div className="flex gap-2">
													{bastDocUrl ? (
														<Button
															variant="outline"
															size="sm"
															className="h-8 w-full border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
															onClick={() =>
																handleViewBast(
																	bastDocUrl,
																)
															}
														>
															<FileText className="w-3 h-3 mr-1" />
															Lihat BAST
														</Button>
													) : (
														<Button
															variant="outline"
															size="sm"
															className="h-8 w-full border-green-200 bg-green-50 text-green-700"
															disabled
														>
															<FileText className="w-3 h-3 mr-1" />
															Sudah BAST
														</Button>
													)}
												</div>
											) : (
												<Button
													variant="outline"
													size="sm"
													className="h-8 w-full"
													onClick={() =>
														handleOpenDialog(item)
													}
												>
													<Plus className="w-3 h-3 mr-1" />
													Buat BAST
												</Button>
											)}
										</TableCell>
									</TableRow>
								);
							})}
							{contract_payment_plan.length === 0 && (
								<TableRow>
									<TableCell
										colSpan={5}
										className="text-center py-8 text-muted-foreground"
									>
										Belum ada rencana pembayaran.
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<CreateBastDialog
				open={isOpen}
				onOpenChange={setIsOpen}
				contractId={contractId}
				plan={selectedPlan}
				onSuccess={() => {
					router.refresh();
				}}
			/>
		</>
	);
}
