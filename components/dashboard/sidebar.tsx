"use client";

import { useSidebar } from "./sidebar-context";
import {
	Home,
	LayoutDashboard,
	Settings,
	LogOut,
	RocketIcon,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const menu = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ name: "Home", href: "/", icon: Home },
	{ name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
	const { collapsed, setCollapsed } = useSidebar();
	const sidebarRef = useRef<HTMLDivElement | null>(null);
	const pathname = usePathname();

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(href + "/");
	}

	// Close sidebar on mobile when clicking outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			const sidebar = sidebarRef.current;
			const isMobile = window.innerWidth < 768;

			if (
				isMobile &&
				sidebar &&
				!sidebar.contains(e.target as Node) &&
				!collapsed
			) {
				setCollapsed(true);
			}
		}

		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, [collapsed, setCollapsed]);

	return (
		<div
			ref={sidebarRef}
			className={`
        flex flex-col h-full border-r bg-white dark:bg-neutral-900
        fixed md:static z-50
        transition-all duration-300 ease-in-out

        ${collapsed ? "w-20" : "w-64"}

        /* Mobile slide-out */
        ${collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"}

        left-0 top-0 h-screen
      `}
		>
			{/* HEADER */}
			<nav className="px-2">
				<div
					className={`
                      flex items-center min-h-16 gap-3 px-6 py-2 rounded-md text-sm
                      transition-all duration-300 `}
				>
					<RocketIcon size={24} className="shrink-0" />

					{/* Animated label */}
					<span
						className={`
                        font-bold text-lg whitespace-nowrap overflow-hidden
                        transition-all duration-300
                        ${
							collapsed
								? "opacity-0 max-w-0"
								: "opacity-100 max-w-[200px]"
						}`}
					>
						Dashboard
					</span>
				</div>
			</nav>

			{/* MENU */}
			<nav className="flex-1 px-2 space-y-1 mt-3">
				{menu.map((m) => {
					const Icon = m.icon;
					return (
						<Link
							key={m.href}
							href={m.href}
							className={`
                                flex items-center gap-3 px-6 py-2 rounded-md text-sm hover:bg-muted
                                transition-all duration-300
                                ${
									isActive(m.href)
										? "bg-muted text-primary font-medium"
										: "text-muted-foreground hover:bg-muted"
								}
                relative
                            `}
						>
							{/* Active bar indicator */}
							{isActive(m.href) && (
								<span
									className="
                    absolute left-0 top-0 h-full w-1 bg-primary rounded-full
                    transition-all duration-300 
                  "
								/>
							)}

							<Icon size={18} className="shrink-0" />

							{/* Animated label */}
							<span
								className={`
                                    whitespace-nowrap overflow-hidden
                                    transition-all duration-300
                                    ${
										collapsed
											? "opacity-0 max-w-0"
											: "opacity-100 max-w-[200px]"
									}
                  `}
							>
								{m.name}
							</span>
						</Link>
					);
				})}
			</nav>

			{/* FOOTER */}
			<div className="p-4 border-t">
				{collapsed ? (
					<div className="flex justify-center transition-opacity duration-300">
						<LogOut />
					</div>
				) : (
					<LogoutButton />
				)}
			</div>
		</div>
	);
}
