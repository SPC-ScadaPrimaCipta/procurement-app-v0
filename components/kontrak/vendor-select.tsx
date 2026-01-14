"use client";

import { useEffect, useState, useMemo } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Option {
	value: string;
	label: string;
	description?: string;
}

interface VendorSelectProps {
	value?: string | string[]; // Can be single string or array of strings
	onChange: (value: string | string[]) => void;
	placeholder?: string;
	multiple?: boolean;
}

export function VendorSelect({
	value,
	onChange,
	placeholder = "Select vendor...",
	multiple = false,
}: VendorSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [options, setOptions] = useState<Option[]>([]);
	const [loading, setLoading] = useState(false);

	// Normalize value to array for internal handling
	const selectedValues = useMemo(() => {
		if (!value) return [];
		return Array.isArray(value) ? value : [value];
	}, [value]);

	useEffect(() => {
		const fetchVendors = async () => {
			setLoading(true);
			try {
				const params = new URLSearchParams();
				if (search) params.set("search", search);
				params.set("limit", "50");

				const res = await fetch(`/api/vendors?${params.toString()}`);
				if (!res.ok) throw new Error("Failed to fetch vendors");
				const result = await res.json();
				const data = result.data || [];

				setOptions(
					data.map((v: any) => ({
						value: v.id,
						label: v.vendor_name,
						description: v.address || v.npwp,
					}))
				);
			} catch (error) {
				console.error("Error fetching vendors:", error);
				setOptions([]);
			} finally {
				setLoading(false);
			}
		};

		const debounce = setTimeout(fetchVendors, 300);
		return () => clearTimeout(debounce);
	}, [search]);

	const handleSelect = (optionValue: string) => {
		if (multiple) {
			const isSelected = selectedValues.includes(optionValue);
			let newValue: string[];
			if (isSelected) {
				newValue = selectedValues.filter((v) => v !== optionValue);
			} else {
				newValue = [...selectedValues, optionValue];
			}
			onChange(newValue);
		} else {
			// Single selection
			onChange(optionValue);
			setOpen(false);
		}
	};

	const handleRemove = (valToRemove: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (multiple) {
			onChange(selectedValues.filter((v) => v !== valToRemove));
		} else {
			onChange("");
		}
	};

	// Find label for selected value(s)
	// If options not loaded, maybe fallback or show spinner?
	// For now we rely on finding in options. If initial value and options empty, it might show ID.
	// We can try to fetch specific ID or just let it be until options load.
	// Enhanced: Try initial fetch or just rely on list.

	// Helper to get label
	const getLabel = (val: string) => {
		const opt = options.find((o) => o.value === val);
		return opt ? opt.label : val; // Fallback to ID if not found (yet)
	};

	return (
		<Popover open={open} onOpenChange={setOpen} modal={true}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between min-h-10 h-auto"
				>
					<div className="flex flex-wrap gap-1 items-center bg-transparent text-left">
						{selectedValues.length === 0 && (
							<span className="text-muted-foreground font-normal">
								{placeholder}
							</span>
						)}
						{selectedValues.length > 0 && (
							<div className="flex flex-wrap gap-1">
								{multiple ? (
									<>
										{selectedValues
											.slice(0, 3)
											.map((val) => (
												<Badge
													variant="secondary"
													key={val}
													className="mr-1"
												>
													{getLabel(val)}
													<span
														className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
														onClick={(e) =>
															handleRemove(val, e)
														}
													>
														<X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
													</span>
												</Badge>
											))}
										{selectedValues.length > 3 && (
											<Badge variant="secondary">
												+{selectedValues.length - 3}{" "}
												more
											</Badge>
										)}
									</>
								) : (
									<span className="font-normal truncate">
										{getLabel(selectedValues[0])}
									</span>
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
						placeholder="Search vendors..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground border-none shadow-none focus-visible:ring-0"
					/>
				</div>
				<div
					className="h-[200px] overflow-y-auto p-1"
					onWheel={(e) => e.stopPropagation()}
					onTouchMove={(e) => e.stopPropagation()}
				>
					{loading && options.length === 0 ? (
						<div className="space-y-2 p-2">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
						</div>
					) : options.length === 0 ? (
						<p className="p-4 text-sm text-muted-foreground text-center">
							No vendors found.
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
											"flex h-4 w-4 items-center justify-center rounded-sm border border-primary shrink-0 mt-0.5",
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
				</div>
			</PopoverContent>
		</Popover>
	);
}
