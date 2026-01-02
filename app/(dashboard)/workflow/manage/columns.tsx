"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/datatable/data-table-column-header";
import { WorkflowRowActions } from "./workflow-row-actions";

import { Workflow } from "./types";

export const createColumns = (onUpdate: () => void): ColumnDef<Workflow>[] => [
	{
		accessorKey: "code",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Code" />
		),
		cell: ({ row }) => <div>{row.getValue("code")}</div>,
	},
	{
		accessorKey: "name",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Name" />
		),
		cell: ({ row }) => <div>{row.getValue("name")}</div>,
	},
	{
		accessorKey: "version",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Version" />
		),
		cell: ({ row }) => <div>v{row.getValue("version")}</div>,
	},
	{
		accessorKey: "is_active",
		header: ({ column }) => (
			<DataTableColumnHeader column={column} title="Status" />
		),
		cell: ({ row }) => {
			const isActive = row.getValue("is_active") as boolean;
			return (
				<Badge variant={isActive ? "default" : "secondary"}>
					{isActive ? "Active" : "Inactive"}
				</Badge>
			);
		},
	},
	{
		id: "actions",
		cell: ({ row }) => (
			<div className="text-right">
				<WorkflowRowActions
					workflow={row.original}
					onUpdate={onUpdate}
				/>
			</div>
		),
	},
];
