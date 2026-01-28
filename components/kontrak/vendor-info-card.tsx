"use client";

import { useEffect, useState } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Building2,
	CreditCard,
	MapPin,
	FileText,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface VendorAccount {
	id: string;
	account_number: string;
	bank: string;
	branch: string;
	is_primary: boolean;
}

interface VendorInfo {
	id: string;
	vendor_name: string;
	supplier_type: string;
	npwp: string | null;
	address: string | null;
	vendor_account: VendorAccount[];
}

interface VendorInfoCardProps {
	vendorId: string | null;
}

export function VendorInfoCard({ vendorId }: VendorInfoCardProps) {
	const [vendor, setVendor] = useState<VendorInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [isExpanded, setIsExpanded] = useState(true);

	useEffect(() => {
		if (!vendorId) {
			setVendor(null);
			return;
		}

		const fetchVendor = async () => {
			try {
				setLoading(true);
				const res = await fetch(`/api/vendors/${vendorId}`);
				if (res.ok) {
					const data = await res.json();
					setVendor(data);
				} else {
					setVendor(null);
				}
			} catch (error) {
				console.error("Failed to fetch vendor info", error);
				setVendor(null);
			} finally {
				setLoading(false);
			}
		};

		fetchVendor();
	}, [vendorId]);

	if (!vendorId) return null;

	if (loading) {
		return (
			<Card className="border-primary/20 bg-primary/5">
				<CardHeader className="pb-3">
					<Skeleton className="h-5 w-32" />
				</CardHeader>
				<CardContent className="space-y-2">
					<Skeleton className="h-4 w-full" />
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-4 w-full" />
				</CardContent>
			</Card>
		);
	}

	if (!vendor) return null;

	const primaryAccount = vendor.vendor_account.find((acc) => acc.is_primary);

	return (
		<Card className="border-primary/20 bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-300">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Building2 className="h-4 w-4 text-primary" />
						<CardTitle className="text-sm font-semibold">
							Informasi Vendor
						</CardTitle>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-6 w-6 p-0"
						onClick={() => setIsExpanded(!isExpanded)}
					>
						{isExpanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				</div>
				<CardDescription className="text-xs">
					Data Detail Vendor beserta Kelengkapan Dokumen
				</CardDescription>
			</CardHeader>

			{isExpanded && (
				<CardContent className="pt-0 space-y-3">
					{/* Vendor Name & Type */}
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-base truncate">
								{vendor.vendor_name}
							</p>
							<Badge variant="secondary" className="mt-1 text-xs">
								{vendor.supplier_type}
							</Badge>
						</div>
					</div>

					<Separator />

					{/* NPWP */}
					{vendor.npwp && (
						<div className="flex items-start gap-2">
							<FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-xs text-muted-foreground">
									NPWP
								</p>
								<p className="font-mono text-sm font-medium">
									{vendor.npwp}
								</p>
							</div>
						</div>
					)}

					{/* Address */}
					{vendor.address && (
						<div className="flex items-start gap-2">
							<MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
							<div className="flex-1 min-w-0">
								<p className="text-xs text-muted-foreground">
									Alamat
								</p>
								<p className="text-sm leading-relaxed">
									{vendor.address}
								</p>
							</div>
						</div>
					)}

					{/* Primary Account */}
					{primaryAccount && (
						<div className="flex items-start gap-2">
							<CreditCard className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<p className="text-xs text-muted-foreground">
										Rekening
									</p>
									<Badge
										variant="default"
										className="text-xs px-1.5 py-0 h-4"
									>
										Primary
									</Badge>
								</div>
								<p className="font-mono text-sm font-medium">
									{primaryAccount.account_number}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{primaryAccount.bank} -{" "}
									{primaryAccount.branch}
								</p>
							</div>
						</div>
					)}

					{vendor.vendor_account.length > 1 && (
						<p className="text-xs text-muted-foreground italic">
							+{vendor.vendor_account.length - 1} rekening lainnya
							tersedia di data vendor
						</p>
					)}
				</CardContent>
			)}
		</Card>
	);
}
