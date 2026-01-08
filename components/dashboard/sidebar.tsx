"use client";

import { useSidebar } from "./sidebar-context";
import {
	LayoutDashboard,
	Settings,
	RocketIcon,
	User,
	ChevronRight,
	UserCircle,
	ShieldCheck,
	Inbox,
	GitBranch,
	UserCheck,
	HeartPulse,
	FileSearch,
	HelpCircle,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type MenuItem = {
	name: string;
	href: string;
	icon: any;
	permissions?: {
		resource: string;
		action: "read" | "create" | "update" | "delete" | "manage";
	}[];
	children?: MenuItem[];
};

const rawMenu: MenuItem[] = [
	{ name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{
		name: "Admin",
		href: "/admin",
		icon: ShieldCheck,
		children: [
			{
				name: "Users",
				href: "/admin/users",
				icon: User,
				permissions: [{ resource: "users", action: "read" }],
			},
			{
				name: "Roles",
				href: "/admin/roles",
				icon: UserCircle,
				permissions: [{ resource: "roles", action: "read" }],
			},
			{
				name: "Permissions",
				href: "/admin/permissions",
				icon: ShieldCheck,
				permissions: [{ resource: "permissions", action: "read" }],
			},
		],
	},
	{
		name: "Workflow",
		href: "/workflow",
		icon: GitBranch,
		children: [
			{
				name: "Inbox",
				href: "/workflow/inbox",
				icon: Inbox,
				permissions: [{ resource: "workflows", action: "read" }],
			},
			{
				name: "My Requests",
				href: "/workflow/requests",
				icon: UserCheck,
				permissions: [{ resource: "workflows", action: "read" }],
			},
			{
				name: "Manage Workflow",
				href: "/workflow/manage",
				icon: Settings,
				permissions: [{ resource: "workflows", action: "read" }],
			},
			{
				name: "Monitoring",
				href: "/workflow/monitoring",
				icon: HeartPulse,
				permissions: [{ resource: "roles", action: "read" }],
			},
			{
				name: "Audit",
				href: "/workflow/audit",
				icon: FileSearch,
				permissions: [{ resource: "roles", action: "read" }],
			},
		],
	},
	{
		name: "Settings",
		href: "/settings",
		icon: Settings,
		children: [
			{ name: "Profile", href: "/settings/profile", icon: UserCircle },
			{
				name: "Account Security",
				href: "/settings/security",
				icon: ShieldCheck,
			},
			// { name: "Appearance", href: "/settings/appearance", icon: Palette },
			// { name: "Billing", href: "/settings/billing", icon: CreditCard },
		],
	},

	{
		name: "Help",
		href: "/help",
		icon: HelpCircle,
	},
];

export function Sidebar() {
	const { collapsed, setCollapsed } = useSidebar();
	const sidebarRef = useRef<HTMLDivElement | null>(null);
	const pathname = usePathname();
	const { data: session } = authClient.useSession();

	function isActive(href: string) {
		return pathname === href || pathname.startsWith(href + "/");
	}

	const menu = useMemo(() => {
		const userPermissions = new Set<string>(
			(session?.user as any)?.permissions || []
		);

		// Helper to check if user has ALL required permissions for an item
		const hasAccess = (
			required?: { resource: string; action: string }[]
		) => {
			if (!required || required.length === 0) return true;

			// Superadmin bypass: "manage:all" grants access to everything
			if (userPermissions.has("manage:all")) return true;

			// For "manage", check if we have the specific permission OR if we are admin/superadmin
			// Although typically better-auth permissions are explicit.
			// We'll check for explicit permission "action:resource"
			return required.every((p) =>
				userPermissions.has(`${p.action}:${p.resource}`)
			);
		};

		const filterItems = (items: MenuItem[]): MenuItem[] => {
			return items
				.map((item) => {
					// Check children first
					if (item.children) {
						const visibleChildren = filterItems(item.children);
						if (visibleChildren.length > 0) {
							return { ...item, children: visibleChildren };
						}
						// If parent has specific permissions, check them even if children are empty?
						// Usually if it's a section header like "Admin", we hide it if no children.
						// If it's a clickable page that also has sub-pages, we might keep it.
						// Here "Admin" is just a grouper.
						return null;
					}

					// Leaf node
					if (hasAccess(item.permissions)) {
						return item;
					}
					return null;
				})
				.filter((item) => item !== null) as MenuItem[];
		};

		return filterItems(rawMenu);
	}, [session]);

	// Manage which accordion is open
	const [openMenu, setOpenMenu] = useState<Record<string, boolean>>({});

	const toggleMenu = (href: string) => {
		setOpenMenu((prev) => ({ ...prev, [href]: !prev[href] }));
	};

	// Auto-expand menu based on URL
	useEffect(() => {
		const newOpenState: Record<string, boolean> = {};

		const traverse = (items: MenuItem[]) => {
			let foundActive = false;
			for (const item of items) {
				if (item.children) {
					const childActive = traverse(item.children); // Recurse
					if (childActive) {
						newOpenState[item.href] = true;
						foundActive = true;
					}
				}
				if (isActive(item.href)) foundActive = true;
			}
			return foundActive;
		};

		if (menu) traverse(menu);
		setOpenMenu((prev) => ({ ...prev, ...newOpenState }));
	}, [pathname, menu]);

	// Close on mobile
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
				flex flex-col border-r bg-white dark:bg-neutral-900
				fixed md:static z-50
				transition-all duration-300 ease-in-out
				${collapsed ? "w-20" : "w-64"}
				${collapsed ? "-translate-x-full md:translate-x-0" : "translate-x-0"}
				left-0 top-0
				h-dvh md:h-screen
				min-h-0
				overflow-hidden
    `}
		>
			{/* HEADER */}
			<nav className="px-2">
				<div className="flex items-center min-h-16 gap-3 px-6 py-2 rounded-md text-sm">
					<RocketIcon size={24} className="shrink-0" />

					<span
						className={`
              font-bold text-lg whitespace-nowrap overflow-hidden
              transition-all duration-300
              ${collapsed ? "opacity-0 max-w-0" : "opacity-100 max-w-[200px]"}
            `}
					>
						Dashboard
					</span>
				</div>
			</nav>

			{/* MENU */}
			<nav className="flex-1 overflow-y-auto min-h-0 px-2 space-y-1 mt-3">
				{menu.map((m) => {
					const Icon = m.icon;

					// --------------------
					// RECURSIVE MENU ITEM
					// --------------------
					const renderMenuItem = (
						item: MenuItem,
						depth: number = 0
					) => {
						const hasChildren =
							item.children && item.children.length > 0;
						const Icon = item.icon;
						const isMenuOpen = openMenu[item.href];
						const itemActive = isActive(item.href);
						const isChildActive =
							hasChildren &&
							item.children!.some((child) =>
								isActive(child.href)
							); // Only checks direct children, but isActive checks prefix so it might be ok?
						// Better check recursive children for active state specifically if we want highlighting parent
						const isAnyDescendantActive = (
							itm: MenuItem
						): boolean => {
							return (
								isActive(itm.href) ||
								(itm.children?.some(isAnyDescendantActive) ??
									false)
							);
						};
						const childActive =
							hasChildren &&
							item.children!.some(isAnyDescendantActive);

						if (hasChildren) {
							return (
								<div key={item.href}>
									<button
										onClick={() => toggleMenu(item.href)}
										className={`
                                            w-full flex items-center gap-3 px-6 py-2 rounded-md text-sm
                                            transition-all duration-300 hover:bg-muted
                                            ${
												childActive
													? "text-primary font-medium"
													: itemActive
													? "bg-muted text-primary font-medium"
													: "text-muted-foreground hover:bg-muted"
											}
                                            ${depth > 0 ? "pl-8" : ""} 
                                        `}
										// Indent children more? No, the parent is at depth 0, children at depth 1.
										// Wait, the button *is* the parent.
										style={{
											paddingLeft:
												depth > 0
													? `${depth * 10 + 24}px`
													: undefined,
										}}
									>
										<Icon size={18} className="shrink-0" />

										<span
											className={`
                                                whitespace-nowrap overflow-hidden transition-all duration-300
                                                ${
													collapsed
														? "opacity-0 max-w-0"
														: "opacity-100 max-w-[200px]"
												}
                                            `}
										>
											{item.name}
										</span>

										{!collapsed && (
											<span className="ml-auto">
												<ChevronRight
													size={16}
													className={`transition-transform duration-200 ${
														isMenuOpen
															? "rotate-90"
															: ""
													}`}
												/>
											</span>
										)}
									</button>

									{/* SUBMENU */}
									{!collapsed && (
										<div
											className={`
                                                overflow-hidden transition-all duration-300
                                                ${
													isMenuOpen
														? "max-h-96"
														: "max-h-0"
												}
                                            `}
										>
											{item.children!.map((child) =>
												renderMenuItem(child, depth + 1)
											)}
										</div>
									)}
								</div>
							);
						}

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`
                                    flex items-center gap-3 px-6 py-2 rounded-md text-sm hover:bg-muted
                                    transition-all duration-300
                                    ${
										itemActive
											? "bg-muted text-primary font-medium"
											: "text-muted-foreground hover:bg-muted"
									}
                                    relative
                                `}
								style={{
									paddingLeft:
										depth > 0
											? `${depth * 10 + 24}px`
											: undefined,
								}}
							>
								{itemActive && (
									<span className="absolute left-0 top-0 h-full w-1 bg-primary rounded-full" />
								)}

								<Icon size={18} className="shrink-0" />

								<span
									className={`
                                        whitespace-nowrap overflow-hidden transition-all duration-300
                                        ${
											collapsed
												? "opacity-0 max-w-0"
												: "opacity-100 max-w-[200px]"
										}
                                    `}
								>
									{item.name}
								</span>
							</Link>
						);
					};

					return renderMenuItem(m);
				})}
			</nav>

			{/* FOOTER */}
			<div className="p-4 border-t shrink-0">
				{collapsed ? <LogoutButton iconOnly /> : <LogoutButton />}
			</div>
		</div>
	);
}
