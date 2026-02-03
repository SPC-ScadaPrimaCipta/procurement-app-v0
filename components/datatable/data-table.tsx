"use client";

import * as React from "react";
import {
	ColumnDef,
	ColumnFiltersState,
	SortingState,
	VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";

import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Filter, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	filterKey?: string;
	statusFilterKey?: string;
	statusColumnId?: string;
	statusFilterLabel?: string;
	enableRowSelection?: boolean;
	onRowClick?: (row: TData) => void;
}

function StatusFilter<TData>({
	column,
	data,
	statusKey,
	title = "Status",
}: {
	column: any;
	data: TData[];
	statusKey: string;
	title?: string;
}) {
	// Extract unique statuses from data
	const uniqueStatuses = React.useMemo(() => {
		const statusMap = new Map<string, number>();
		data.forEach((item: any) => {
			const keys = statusKey.split(".");
			let value = item;
			for (const key of keys) {
				value = value?.[key];
			}
			if (value) {
				statusMap.set(value, (statusMap.get(value) || 0) + 1);
			}
		});
		return Array.from(statusMap.entries())
			.map(([status, count]) => ({ status, count }))
			.sort((a, b) => a.status.localeCompare(b.status));
	}, [data, statusKey]);

	const selectedValues = new Set(
		(column?.getFilterValue() as string[]) || []
	);

	const handleSelectAll = () => {
		if (selectedValues.size === uniqueStatuses.length) {
			column?.setFilterValue(undefined);
		} else {
			const allStatuses = uniqueStatuses.map((s) => s.status);
			column?.setFilterValue(allStatuses);
		}
	};

	const handleToggle = (status: string) => {
		const newSelectedValues = new Set(selectedValues);
		if (newSelectedValues.has(status)) {
			newSelectedValues.delete(status);
		} else {
			newSelectedValues.add(status);
		}
		const filterValues = Array.from(newSelectedValues);
		column?.setFilterValue(
			filterValues.length ? filterValues : undefined
		);
	};

	const handleClear = () => {
		column?.setFilterValue(undefined);
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-9 border-dashed">
					<Filter className="mr-2 h-4 w-4" />
					{title}
					{selectedValues.size > 0 && (
						<>
							<Separator orientation="vertical" className="mx-2 h-4" />
							<Badge
								variant="secondary"
								className="rounded-sm px-1 font-normal"
							>
								{selectedValues.size}
							</Badge>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[250px] p-0" align="start">
				<div className="p-2">
					<div className="flex items-center justify-between px-2 py-1.5">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 px-2 text-xs"
							onClick={handleSelectAll}
						>
							{selectedValues.size === uniqueStatuses.length
								? "Deselect All"
								: "Select All"}
						</Button>
						{selectedValues.size > 0 && (
							<Button
								variant="ghost"
								size="sm"
								className="h-8 px-2 text-xs"
								onClick={handleClear}
							>
								Clear
								<X className="ml-1 h-3 w-3" />
							</Button>
						)}
					</div>
					<Separator className="my-2" />
					<div className="max-h-64 overflow-auto">
						{uniqueStatuses.map(({ status, count }) => {
							const isSelected = selectedValues.has(status);
							return (
								<div
									key={status}
									className="flex items-center space-x-2 px-2 py-1.5 hover:bg-accent rounded-sm cursor-pointer"
									onClick={() => handleToggle(status)}
								>
									<Checkbox
										checked={isSelected}
										onCheckedChange={() => handleToggle(status)}
									/>
									<span className="flex-1 text-sm">{status}</span>
									<span className="text-xs text-muted-foreground">
										{count}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

export function DataTable<TData, TValue>({
	columns,
	data,
	filterKey,
	statusFilterKey,
	statusColumnId,
	statusFilterLabel,
	enableRowSelection = false,
	onRowClick,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = React.useState<SortingState>([]);
	const [columnFilters, setColumnFilters] =
		React.useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] =
		React.useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = React.useState({});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
		},
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-2 flex-1">
					{filterKey && (
						<Input
							placeholder={`Filter by ${filterKey}...`}
							value={
								(table
									.getColumn(filterKey)
									?.getFilterValue() as string) ?? ""
							}
							onChange={(event) =>
								table
									.getColumn(filterKey)
									?.setFilterValue(event.target.value)
							}
							className="max-w-sm"
						/>
					)}
					{statusFilterKey && statusColumnId && (
						<StatusFilter
							column={table.getColumn(statusColumnId)}
							data={data}
							statusKey={statusFilterKey}
							title={statusFilterLabel}
						/>
					)}
				</div>
				<DataTableViewOptions table={table} />
			</div>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => {
									return (
										<TableHead key={header.id}>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef
															.header,
														header.getContext()
												  )}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={
										row.getIsSelected() && "selected"
									}
									onClick={() => onRowClick?.(row.original)}
									className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id}>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext()
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination
				table={table}
				enableRowSelection={enableRowSelection}
			/>
		</div>
	);
}
