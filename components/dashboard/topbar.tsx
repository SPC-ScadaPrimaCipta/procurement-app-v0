"use client";

import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar-context";
import { UserMenu } from "./user-menu";
import { ThemeSwitcher } from "../theme-switcher";

export function Topbar() {
	const { toggle } = useSidebar();

	return (
		<header className="h-16 flex items-center px-4 border-b bg-white dark:bg-neutral-900">
			<button
				className="p-2 rounded hover:bg-muted mr-2"
				onClick={toggle}
			>
				<Menu />
			</button>

			<div className="font-medium text-lg flex-1 text-left">
				Dashboard
			</div>
			<div className="flex items-center gap-2">
				<ThemeSwitcher />
				<UserMenu />
			</div>
		</header>
	);
}
