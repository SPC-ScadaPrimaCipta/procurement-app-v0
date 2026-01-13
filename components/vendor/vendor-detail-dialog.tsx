"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BankAccountFormDialog } from "./bank-account-form-dialog";
import { BusinessLicenseFormDialog } from "./business-license-form-dialog";
import { ManagementFormDialog } from "./management-form-dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface VendorDetailDialogProps {
	vendorId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface VendorDetail {
	id: string;
	vendor_name: string;
	npwp: string | null;
	address: string | null;
	supplier_type: {
		name: string;
	};
	vendor_bank_account: BankAccount[];
	vendor_business_license: BusinessLicense[];
	vendor_management: Management[];
}

interface BankAccount {
	id: string;
	account_number: string;
	account_name: string | null;
	bank_name: string | null;
	branch_name: string | null;
	currency_code: string | null;
	is_primary: boolean;
}

interface BusinessLicense {
	id: string;
	license_type: string;
	license_number: string;
	qualification: string | null;
	issued_date: string | null;
	expiry_date: string | null;
}

interface Management {
	id: string;
	full_name: string;
	position_title: string | null;
	phone: string | null;
	email: string | null;
}

export function VendorDetailDialog({
	vendorId,
	open,
	onOpenChange,
}: VendorDetailDialogProps) {
	const [vendor, setVendor] = useState<VendorDetail | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [expandedSections, setExpandedSections] = useState({
		bankAccount: true,
		license: false,
		management: false,
	});

	// Bank Account Form State
	const [bankFormOpen, setBankFormOpen] = useState(false);
	const [editingBankAccount, setEditingBankAccount] =
		useState<BankAccount | null>(null);

	// Business License Form State
	const [licenseFormOpen, setLicenseFormOpen] = useState(false);
	const [editingLicense, setEditingLicense] =
		useState<BusinessLicense | null>(null);

	// Management Form State
	const [managementFormOpen, setManagementFormOpen] = useState(false);
	const [editingManagement, setEditingManagement] =
		useState<Management | null>(null);

	// Delete Confirmation State
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [deleteType, setDeleteType] = useState<"bank" | "license" | "management" | null>(null);
	const [deletingBankAccountId, setDeletingBankAccountId] = useState<
		string | null
	>(null);
	const [deletingLicenseId, setDeletingLicenseId] = useState<string | null>(
		null
	);
	const [deletingManagementId, setDeletingManagementId] = useState<
		string | null
	>(null);

	useEffect(() => {
		if (open && vendorId) {
			fetchVendorDetail();
		}
	}, [open, vendorId]);

	const fetchVendorDetail = async () => {
		if (!vendorId) return;

		setIsLoading(true);
		try {
			const response = await fetch(`/api/vendors/${vendorId}/detail`);
			if (!response.ok) throw new Error("Failed to fetch vendor detail");

			const data = await response.json();
			setVendor(data);
		} catch (error) {
			toast.error("Failed to load vendor details");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const toggleSection = (section: keyof typeof expandedSections) => {
		setExpandedSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const handleAddBankAccount = () => {
		setEditingBankAccount(null);
		setBankFormOpen(true);
	};

	const handleEditBankAccount = (account: BankAccount) => {
		setEditingBankAccount(account);
		setBankFormOpen(true);
	};

	const handleAddLicense = () => {
		setEditingLicense(null);
		setLicenseFormOpen(true);
	};

	const handleEditLicense = (license: BusinessLicense) => {
		setEditingLicense(license);
		setLicenseFormOpen(true);
	};

	const handleAddManagement = () => {
		setEditingManagement(null);
		setManagementFormOpen(true);
	};

	const handleEditManagement = (management: Management) => {
		setEditingManagement(management);
		setManagementFormOpen(true);
	};

	const handleDeleteBankAccount = async () => {
		if (!vendorId || !deletingBankAccountId) return;

		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/bank-accounts/${deletingBankAccountId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete bank account");
			}

			toast.success("Bank account deleted successfully");
			setDeleteDialogOpen(false);
			setDeletingBankAccountId(null);
			setDeleteType(null);
			fetchVendorDetail(); // Refresh data
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete bank account"
			);
		}
	};

	const handleDeleteLicense = async () => {
		if (!vendorId || !deletingLicenseId) return;

		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/business-licenses/${deletingLicenseId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete business license");
			}

			toast.success("Business license deleted successfully");
			setDeleteDialogOpen(false);
			setDeletingLicenseId(null);
			setDeleteType(null);
			fetchVendorDetail(); // Refresh data
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete business license"
			);
		}
	};

	const handleDeleteManagement = async () => {
		if (!vendorId || !deletingManagementId) return;

		try {
			const response = await fetch(
				`/api/vendors/${vendorId}/management/${deletingManagementId}`,
				{
					method: "DELETE",
				}
			);

			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to delete management");
			}

			toast.success("Management deleted successfully");
			setDeleteDialogOpen(false);
			setDeletingManagementId(null);
			setDeleteType(null);
			fetchVendorDetail(); // Refresh data
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete management"
			);
		}
	};

	const handleDelete = async () => {
		if (deleteType === "bank") {
			await handleDeleteBankAccount();
		} else if (deleteType === "license") {
			await handleDeleteLicense();
		} else if (deleteType === "management") {
			await handleDeleteManagement();
		}
	};

	const openDeleteDialog = (
		type: "bank" | "license" | "management",
		id: string
	) => {
		setDeleteType(type);
		if (type === "bank") {
			setDeletingBankAccountId(id);
		} else if (type === "license") {
			setDeletingLicenseId(id);
		} else if (type === "management") {
			setDeletingManagementId(id);
		}
		setDeleteDialogOpen(true);
	};

	if (!vendor && !isLoading) return null;

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle className="text-xl">
							{vendor?.vendor_name}
						</DialogTitle>
					</DialogHeader>

				{isLoading ? (
					<div className="py-8 text-center text-muted-foreground">
						Loading...
					</div>
				) : vendor ? (
					<div className="space-y-6">
						{/* Basic Info */}
						<div className="space-y-3">
							<div>
								<p className="text-sm text-muted-foreground">Jenis Supplier</p>
								<p className="font-medium">{vendor.supplier_type.name}</p>
							</div>

							<div>
								<p className="text-sm text-muted-foreground">NPWP</p>
								<p className="font-mono">{vendor.npwp || "-"}</p>
							</div>

							<div>
								<p className="text-sm text-muted-foreground">Alamat</p>
								<p>{vendor.address || "-"}</p>
							</div>
						</div>

						<Separator />

						{/* Nomor Rekening */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<button
									onClick={() => toggleSection("bankAccount")}
									className="flex items-center gap-2 text-base font-semibold hover:text-primary"
								>
									{expandedSections.bankAccount ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									Nomor Rekening
									<Badge variant="secondary" className="ml-2">
										{vendor.vendor_bank_account.length}
									</Badge>
								</button>
								<Button
									size="sm"
									variant="outline"
									onClick={handleAddBankAccount}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add
								</Button>
							</div>

							{expandedSections.bankAccount && (
								<div className="space-y-2">
									{vendor.vendor_bank_account.length > 0 ? (
										<div className="rounded-lg border">
											<table className="w-full">
												<thead>
													<tr className="border-b bg-muted/50">
														<th className="p-3 text-left text-sm font-medium">
															Nomor Rekening
														</th>
														<th className="p-3 text-left text-sm font-medium">
															Bank
														</th>
														<th className="p-3 text-left text-sm font-medium">
															Cabang
														</th>
														<th className="p-3 text-center text-sm font-medium w-24">
															Actions
														</th>
													</tr>
												</thead>
												<tbody>
													{vendor.vendor_bank_account.map((account) => (
														<tr key={account.id} className="border-b last:border-0">
															<td className="p-3">
																<div className="flex items-center gap-2">
																	<span className="font-mono text-sm">
																		{account.account_number}
																	</span>
																	{account.is_primary && (
																		<Badge
																			variant="default"
																			className="text-xs"
																		>
																			Primary
																		</Badge>
																	)}
																</div>
															</td>
															<td className="p-3 text-sm">
																{account.bank_name || "-"}
															</td>
															<td className="p-3 text-sm">
																{account.branch_name || "-"}
															</td>
															<td className="p-3">
																<div className="flex items-center justify-center gap-1">
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() =>
																			handleEditBankAccount(account)
																		}
																	>
																		<Pencil className="h-4 w-4" />
																	</Button>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() =>
																			openDeleteDialog("bank", account.id)
																		}
																	>
																		<Trash2 className="h-4 w-4 text-destructive" />
																	</Button>
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<p className="text-center py-8 text-muted-foreground text-sm">
											No items
										</p>
									)}
								</div>
							)}
						</div>

						<Separator />

						{/* Izin Usaha */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<button
									onClick={() => toggleSection("license")}
									className="flex items-center gap-2 text-base font-semibold hover:text-primary"
								>
									{expandedSections.license ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									Izin Usaha
									<Badge variant="secondary" className="ml-2">
										{vendor.vendor_business_license.length}
									</Badge>
								</button>
								<Button
									size="sm"
									variant="outline"
									onClick={handleAddLicense}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add
								</Button>
							</div>

							{expandedSections.license && (
								<div className="space-y-2">
									{vendor.vendor_business_license.length > 0 ? (
										<div className="rounded-lg border">
											<table className="w-full">
												<thead>
													<tr className="border-b bg-muted/50">
														<th className="p-3 text-left text-sm font-medium">
															Jenis
														</th>
														<th className="p-3 text-left text-sm font-medium">
															Nomor
														</th>
														<th className="p-3 text-left text-sm font-medium">
															Kualifikasi
														</th>
														<th className="p-3 text-center text-sm font-medium w-24">
															Actions
														</th>
													</tr>
												</thead>
												<tbody>
													{vendor.vendor_business_license.map((license) => (
														<tr key={license.id} className="border-b last:border-0">
															<td className="p-3 text-sm">
																{license.license_type}
															</td>
															<td className="p-3 font-mono text-sm">
																{license.license_number}
															</td>
															<td className="p-3 text-sm">
																{license.qualification || "-"}
															</td>
															<td className="p-3">
																<div className="flex items-center justify-center gap-1">
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() => handleEditLicense(license)}
																	>
																		<Pencil className="h-4 w-4" />
																	</Button>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() =>
																			openDeleteDialog("license", license.id)
																		}
																	>
																		<Trash2 className="h-4 w-4 text-destructive" />
																	</Button>
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<p className="text-center py-8 text-muted-foreground text-sm">
											No items
										</p>
									)}
								</div>
							)}
						</div>

						<Separator />

						{/* Manajerial */}
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<button
									onClick={() => toggleSection("management")}
									className="flex items-center gap-2 text-base font-semibold hover:text-primary"
								>
									{expandedSections.management ? (
										<ChevronDown className="h-4 w-4" />
									) : (
										<ChevronRight className="h-4 w-4" />
									)}
									Manajerial
									<Badge variant="secondary" className="ml-2">
										{vendor.vendor_management.length}
									</Badge>
								</button>
								<Button
									size="sm"
									variant="outline"
									onClick={handleAddManagement}
								>
									<Plus className="h-4 w-4 mr-1" />
									Add
								</Button>
							</div>

							{expandedSections.management && (
								<div className="space-y-2">
									{vendor.vendor_management.length > 0 ? (
										<div className="rounded-lg border">
											<table className="w-full">
												<thead>
													<tr className="border-b bg-muted/50">
														<th className="p-3 text-left text-sm font-medium">
															Nama
														</th>
														<th className="p-3 text-left text-sm font-medium">
															Jabatan
														</th>
														<th className="p-3 text-left text-sm font-medium">
															Email
														</th>
														<th className="p-3 text-center text-sm font-medium w-24">
															Actions
														</th>
													</tr>
												</thead>
												<tbody>
													{vendor.vendor_management.map((person) => (
														<tr key={person.id} className="border-b last:border-0">
															<td className="p-3 text-sm">{person.full_name}</td>
															<td className="p-3 text-sm">
																{person.position_title || "-"}
															</td>
															<td className="p-3 text-sm">
																{person.email || "-"}
															</td>
															<td className="p-3">
																<div className="flex items-center justify-center gap-1">
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() => handleEditManagement(person)}
																	>
																		<Pencil className="h-4 w-4" />
																	</Button>
																	<Button
																		size="sm"
																		variant="ghost"
																		onClick={() =>
																			openDeleteDialog("management", person.id)
																		}
																	>
																		<Trash2 className="h-4 w-4 text-destructive" />
																	</Button>
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
									) : (
										<p className="text-center py-8 text-muted-foreground text-sm">
											No items
										</p>
									)}
								</div>
							)}
						</div>
					</div>
				) : null}
			</DialogContent>
		</Dialog>

		{/* Bank Account Form Dialog */}
		{vendorId && (
			<BankAccountFormDialog
				vendorId={vendorId}
				accountId={editingBankAccount?.id}
				initialData={
					editingBankAccount
						? {
								account_number: editingBankAccount.account_number,
								account_name: editingBankAccount.account_name || "",
								bank_name: editingBankAccount.bank_name || "",
								branch_name: editingBankAccount.branch_name || "",
								currency_code: editingBankAccount.currency_code || "IDR",
								is_primary: editingBankAccount.is_primary,
						  }
						: undefined
				}
				open={bankFormOpen}
				onOpenChange={setBankFormOpen}
				onSuccess={fetchVendorDetail}
			/>
		)}

		{/* Business License Form Dialog */}
		{vendorId && (
			<BusinessLicenseFormDialog
				vendorId={vendorId}
				licenseId={editingLicense?.id}
				initialData={
					editingLicense
						? {
								license_type: editingLicense.license_type,
								license_number: editingLicense.license_number,
								qualification: editingLicense.qualification || "",
								issued_date: editingLicense.issued_date
									? editingLicense.issued_date.split("T")[0]
									: "",
								expiry_date: editingLicense.expiry_date
									? editingLicense.expiry_date.split("T")[0]
									: "",
						  }
						: undefined
				}
				open={licenseFormOpen}
				onOpenChange={setLicenseFormOpen}
				onSuccess={fetchVendorDetail}
			/>
		)}

		{/* Management Form Dialog */}
		{vendorId && (
			<ManagementFormDialog
				vendorId={vendorId}
				managementId={editingManagement?.id}
				initialData={
					editingManagement
						? {
								full_name: editingManagement.full_name,
								position_title: editingManagement.position_title || "",
								phone: editingManagement.phone || "",
								email: editingManagement.email || "",
						  }
						: undefined
				}
				open={managementFormOpen}
				onOpenChange={setManagementFormOpen}
				onSuccess={fetchVendorDetail}
			/>
		)}

		{/* Delete Confirmation Dialog */}
		<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>
						{deleteType === "bank"
							? "Hapus Rekening Bank?"
							: deleteType === "license"
							? "Hapus Izin Usaha?"
							: "Hapus Manajerial?"}
					</AlertDialogTitle>
					<AlertDialogDescription>
						Tindakan ini tidak dapat dibatalkan.{" "}
						{deleteType === "bank"
							? "Rekening bank akan dihapus secara permanen dari vendor ini."
							: deleteType === "license"
							? "Izin usaha akan dihapus secara permanen dari vendor ini."
							: "Data manajerial akan dihapus secara permanen dari vendor ini."}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Batal</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDelete}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Hapus
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	</>
	);
}
