"use client";

import { Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useThemeColor } from "@/hooks/use-theme-color";
import { useTheme } from "next-themes";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";

export function ThemeSelector() {
	const {
		setColor,
		colorThemes,
		colorTheme: currentColorTheme,
	} = useThemeColor();
	const { theme: currentTheme } = useTheme();
	const isDark = currentTheme === "dark";

	return (
		<Popover>
			<Tooltip>
				<TooltipTrigger asChild>
					<PopoverTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							aria-label="Select theme color"
							className="rounded-full"
						>
							<Palette className="h-5 w-5" />
						</Button>
					</PopoverTrigger>
				</TooltipTrigger>
				<TooltipContent side="bottom">
					Select color theme
				</TooltipContent>
			</Tooltip>
			<PopoverContent className="w-64" align="end">
				<div className="space-y-3">
					<h4 className="font-medium text-sm text-foreground">
						Theme Color
					</h4>
					<div className="grid grid-cols-3 gap-2">
						{colorThemes.map((theme) => {
							const isActive =
								theme.name ===
								(currentColorTheme?.name ||
									colorThemes[0].name);
							return (
								<button
									key={theme.name}
									onClick={() => setColor(theme)}
									className={`flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors ${
										isActive
											? "ring-2 ring-primary ring-offset-2"
											: ""
									}`}
								>
									<div
										className="w-10 h-10 rounded-full border-2 border-border"
										style={{
											backgroundColor: isDark
												? theme.dark["--primary"]
												: theme.light["--primary"],
										}}
									/>
									<span className="text-xs text-muted-foreground">
										{theme.name}
									</span>
								</button>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}
