export const dynamic = "force-dynamic";

import { Sidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import { Topbar } from "@/components/dashboard/topbar";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// Fetch server headers
	const h = await headers();
	const headerObj: Record<string, string> = {};
	h.forEach((v, k) => (headerObj[k] = v));

	// Get session
	const session = await auth.api.getSession({
		headers: headerObj,
	});

	// Protect route
	if (!session) redirect("/auth/login");

	return (
		<SidebarProvider>
			<div className="flex h-screen overflow-hidden">
				<Sidebar />

				{/* Main content */}
				<div className="flex-1 flex flex-col">
					<Topbar />

					<main className="flex-1 overflow-y-auto p-6 bg-muted/20">
						{children}
					</main>
				</div>
			</div>
		</SidebarProvider>
	);
}
