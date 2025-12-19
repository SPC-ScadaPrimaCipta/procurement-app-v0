"use client";

import { useEffect, useState, useMemo, type MouseEvent } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DYNAMIC_RESOLVERS } from "@/lib/workflow/dynamic-registry";

interface ApproverSelectProps {
	strategy: string;
	selectedOptions: Option[];
	onChange: (options: Option[]) => void;
	placeholder?: string;
}

interface Option {
	value: string;
	label: string;
	description?: string;
}

export function ApproverSelect({
	strategy,
	selectedOptions = [],
	onChange,
	placeholder,
}: ApproverSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<Option[]>([]);
	const [loading, setLoading] = useState(false);

	const selectedValues = useMemo(() => {
		return selectedOptions.map((o) => o.value);
	}, [selectedOptions]);

	useEffect(() => {
		if (
			strategy !== "USER" &&
			strategy !== "ROLE" &&
			strategy !== "DYNAMIC"
		) {
			setOptions([]);
			return;
		}

		const fetchOptions = async () => {
			setLoading(true);
			try {
				if (strategy === "USER") {
					// Fetch users
					const params = new URLSearchParams();
					if (search) params.set("search", search);
					params.set("limit", "50"); // Reasonable limit

					const res = await fetch(
						`/api/admin/list-users?${params.toString()}`
					);
					if (!res.ok) throw new Error("Failed to fetch users");
					const data = await res.json();
					setOptions(
						data.users.map((u: any) => ({
							value: u.id,
							label: u.name,
							description: u.email,
						}))
					);
				} else if (strategy === "ROLE") {
					// Fetch roles
					const res = await fetch("/api/admin/roles");
					if (!res.ok) throw new Error("Failed to fetch roles");
					const data = await res.json();
					// Client-side filter for roles since API doesn't support search
					const filtered = search
						? data.filter((r: any) =>
								r.name
									.toLowerCase()
									.includes(search.toLowerCase())
						  )
						: data;

					setOptions(
						filtered.map((r: any) => ({
							value: r.name, // Using name as Role Code
							label: r.name,
							description: r.description,
						}))
					);
				} else if (strategy === "DYNAMIC") {
					const resolvers = Object.entries(DYNAMIC_RESOLVERS).map(
						([key, value]) => ({
							value: key,
							label: value.label,
							description: value.description,
						})
					);

					const filtered = search
						? resolvers.filter((r) =>
								r.label
									.toLowerCase()
									.includes(search.toLowerCase())
						  )
						: resolvers;

					setOptions(filtered);
				}
			} catch (error) {
				console.error("Error fetching options:", error);
				setOptions([]);
			} finally {
				setLoading(false);
			}
		};

		const debounce = setTimeout(fetchOptions, 300);
		return () => clearTimeout(debounce);
	}, [strategy, search]);

	const handleSelect = (optionValue: string) => {
		const isSelected = selectedValues.includes(optionValue);
		if (isSelected) {
			onChange(selectedOptions.filter((o) => o.value !== optionValue));
		} else {
			const option = options.find((o) => o.value === optionValue);
			if (option) {
				onChange([...selectedOptions, option]);
			}
		}
	};

	const handleRemove = (valToRemove: string, e: MouseEvent) => {
		e.stopPropagation();
		onChange(selectedOptions.filter((o) => o.value !== valToRemove));
	};

	// Disabled state or manual input for other strategies
	if (strategy !== "USER" && strategy !== "ROLE" && strategy !== "DYNAMIC") {
		return (
			<Input
				value={selectedOptions[0]?.value || ""}
				onChange={(e) =>
					onChange([{ value: e.target.value, label: e.target.value }])
				}
				placeholder={placeholder || "Enter value..."}
			/>
		);
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between min-h-10 h-auto"
				>
					<div className="flex flex-wrap gap-1 items-center bg-transparent">
						{selectedValues.length === 0 && (
							<span className="text-muted-foreground font-normal">
								Select {strategy.toLowerCase()}s...
							</span>
						)}
						{selectedValues.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{selectedValues.slice(0, 3).map((val) => {
									// Try to find label in options, or fallback to val
									const opt = options.find(
										(o) => o.value === val
									);
									// If we haven't loaded options yet (e.g. initial render), we might just show ID/Name
									// Ideally we would fetch selected items separately if not in list, but for now simple fallback
									return (
										<Badge
											variant="secondary"
											key={val}
											className="mr-1"
										>
											{opt ? opt.label : val}
											<span
												className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
												onClick={(e) =>
													handleRemove(val, e)
												}
											>
												<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
											</span>
										</Badge>
									);
								})}
								{selectedValues.length > 3 && (
									<Badge variant="secondary">
										+{selectedValues.length - 3} more
									</Badge>
								)}
							</div>
						)}
					</div>
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[400px] p-0" align="start">
				<div className="flex items-center border-b px-3 py-2">
					<Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
					<Input
						placeholder={`Search ${strategy.toLowerCase()}s...`}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
					/>
				</div>
				<ScrollArea className="h-[200px] p-1">
					{loading && options.length === 0 ? (
						<div className="space-y-2 p-2">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					) : options.length === 0 ? (
						<p className="p-4 text-sm text-muted-foreground text-center">
							No {strategy.toLowerCase()}s found.
						</p>
					) : (
						<div className="grid gap-1">
							{options.map((option) => (
								<div
									key={option.value}
									className={cn(
										"flex items-start gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
										selectedValues.includes(option.value)
											? "bg-accent/50"
											: ""
									)}
									onClick={() => handleSelect(option.value)}
								>
									<div
										className={cn(
											"flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
											selectedValues.includes(
												option.value
											)
												? "bg-primary text-primary-foreground"
												: "opacity-50 [&_svg]:invisible"
										)}
									>
										<Check className={cn("h-4 w-4")} />
									</div>
									<div className="flex flex-col">
										<span className="font-medium">
											{option.label}
										</span>
										{option.description && (
											<span className="text-xs text-muted-foreground">
												{option.description}
											</span>
										)}
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
}
