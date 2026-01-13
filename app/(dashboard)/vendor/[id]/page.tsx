import { VendorForm } from "@/components/vendor/vendor-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

interface VendorEditPageProps {
	params: Promise<{
		id: string;
	}>;
}

async function getVendor(id: string) {
	try {
		const vendor = await prisma.vendor.findUnique({
			where: { id },
			include: {
				supplier_type: true,
			},
		});

		return vendor;
	} catch (error) {
		console.error("Error fetching vendor:", error);
		return null;
	}
}

export default async function VendorEditPage({ params }: VendorEditPageProps) {
	const { id } = await params;
	const vendor = await getVendor(id);

	if (!vendor) {
		notFound();
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button variant="ghost" size="icon" asChild>
					<Link href="/vendor">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Edit Vendor</h1>
					<p className="text-muted-foreground">{vendor.vendor_name}</p>
				</div>
			</div>

			{/* Form */}
			<div className="rounded-lg border bg-card p-6">
				<VendorForm
					vendorId={vendor.id}
					initialData={{
						id: vendor.id,
						vendor_name: vendor.vendor_name,
						supplier_type_id: vendor.supplier_type_id,
						npwp: vendor.npwp || "",
						address: vendor.address || "",
						is_active: vendor.is_active,
					}}
				/>
			</div>
		</div>
	);
}
