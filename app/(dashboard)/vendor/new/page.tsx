import { VendorForm } from "@/components/vendor/vendor-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewVendorPage() {
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
					<h1 className="text-3xl font-bold tracking-tight">Tambah Vendor</h1>
					<p className="text-muted-foreground">
						Tambahkan vendor baru ke dalam sistem
					</p>
				</div>
			</div>

			{/* Form */}
			<div className="rounded-lg border bg-card p-6">
				<VendorForm />
			</div>
		</div>
	);
}
