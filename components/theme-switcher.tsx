"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
	const { theme, setTheme } = useTheme();

	const toggle = () => {
		setTheme(theme === "light" ? "dark" : "light");
	};

	return (
		<Button variant="ghost" size="icon" onClick={toggle}>
			<Sun className="h-5 w-5 rotate-0 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}
