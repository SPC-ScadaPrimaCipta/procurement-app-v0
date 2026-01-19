import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export type PaymentMethod = "SEKALIGUS" | "TERMIN";

export interface PaymentPlanItem {
	payment_method: PaymentMethod;
	line_no: number;
	amount: number;
}

interface ContractPaymentPlanProps {
	readOnly?: boolean;
	value?: PaymentPlanItem[];
	onChange?: (value: PaymentPlanItem[]) => void;
}

export function ContractPaymentPlan({
	readOnly = false,
	value = [],
	onChange,
}: ContractPaymentPlanProps) {
	const handleAdd = () => {
		if (onChange) {
			const newItem: PaymentPlanItem = {
				payment_method: "TERMIN",
				line_no: value.length + 1,
				amount: 0,
			};
			onChange([...value, newItem]);
		}
	};

	const handleRemove = (index: number) => {
		if (onChange) {
			const newValue = [...value];
			newValue.splice(index, 1);
			onChange(newValue);
		}
	};

	const handleChange = (
		index: number,
		field: keyof PaymentPlanItem,
		val: any
	) => {
		if (onChange) {
			const newValue = [...value];
			newValue[index] = { ...newValue[index], [field]: val };
			onChange(newValue);
		}
	};

	return (
		<Card className="border-dashed shadow-none">
			<CardHeader className="px-4">
				<div className="flex items-center justify-between">
					<CardTitle className="text-sm font-medium">
						Rencana Pembayaran (Termin)
					</CardTitle>
					{!readOnly && (
						<Button
							size="sm"
							variant="outline"
							type="button"
							onClick={handleAdd}
						>
							<Plus className="w-3 h-3 mr-1" /> Tambah
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="p-0">
				{value.length === 0 ? (
					<p className="text-xs text-muted-foreground text-center py-6">
						Belum ada data rencana pembayaran.
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-[80px]">Line</TableHead>
								<TableHead>Metode</TableHead>
								<TableHead>Nilai (IDR)</TableHead>
								{!readOnly && (
									<TableHead className="w-[50px]"></TableHead>
								)}
							</TableRow>
						</TableHeader>
						<TableBody>
							{value.map((item, index) => (
								<TableRow key={index}>
									<TableCell>
										{readOnly ? (
											item.line_no
										) : (
											<Input
												type="number"
												value={item.line_no}
												onChange={(e) =>
													handleChange(
														index,
														"line_no",
														e.target.valueAsNumber
													)
												}
												className="h-8"
											/>
										)}
									</TableCell>
									<TableCell>
										{readOnly ? (
											item.payment_method
										) : (
											<Select
												value={item.payment_method}
												onValueChange={(val) =>
													handleChange(
														index,
														"payment_method",
														val
													)
												}
											>
												<SelectTrigger className="h-8">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="TERMIN">
														TERMIN
													</SelectItem>
													<SelectItem value="SEKALIGUS">
														SEKALIGUS
													</SelectItem>
												</SelectContent>
											</Select>
										)}
									</TableCell>
									<TableCell>
										{readOnly ? (
											new Intl.NumberFormat("id-ID", {
												style: "currency",
												currency: "IDR",
											}).format(item.amount)
										) : (
											<div className="relative">
												<span className="absolute left-2 top-1.5 text-xs text-muted-foreground">
													Rp
												</span>
												<Input
													type="number"
													value={item.amount}
													onChange={(e) =>
														handleChange(
															index,
															"amount",
															e.target
																.valueAsNumber
														)
													}
													className="h-8 pl-7 text-right"
													placeholder="0"
												/>
											</div>
										)}
									</TableCell>
									{!readOnly && (
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive/90"
												onClick={() =>
													handleRemove(index)
												}
											>
												<Trash2 className="w-4 h-4" />
											</Button>
										</TableCell>
									)}
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
