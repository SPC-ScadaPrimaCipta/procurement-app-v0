"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Edit, Loader2 } from "lucide-react";
import { AdminPermissionsSkeleton } from "@/components/skeletons";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRequirePermission } from "@/hooks/use-require-permission";

interface Permission {
	id: string;
	action: string;
	resource: string;
	description: string | null;
}

export default function PermissionsPage() {
	const { isAuthorized, isLoading: authLoading } = useRequirePermission(
		"read",
		"permissions"
	);

	const { isAuthorized: canManage } = useRequirePermission(
		"manage",
		"permissions",
		{ redirect: false }
	);

	const [permissions, setPermissions] = useState<Permission[]>([]);
	const [loading, setLoading] = useState(true);	const [isInitialLoading, setIsInitialLoading] = useState(true);	const [open, setOpen] = useState(false);
	const [editingPermission, setEditingPermission] =
		useState<Permission | null>(null);

	// Form state
	const [action, setAction] = useState("");
	const [resource, setResource] = useState("");
	const [description, setDescription] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (isAuthorized) {
			fetchPermissions();
		}
	}, [isAuthorized]);

	const fetchPermissions = async () => {
		try {
			const res = await fetch("/api/admin/permissions");
			const data = await res.json();
			setPermissions(data);
		} catch (error) {
			console.error("Failed to fetch permissions", error);
			toast.error("Failed to fetch permissions");
		} finally {
			setLoading(false);
		}
	};

	if (authLoading) {
		return (
			<div className="flex h-[50vh] w-full items-center justify-center">
				<Loader2 className="size-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!isAuthorized) {
		return null;
	}

	if (isInitialLoading) {
		return <AdminPermissionsSkeleton />;
	}

	const handleCreate = () => {
		setEditingPermission(null);
		setAction("");
		setResource("");
		setDescription("");
		setOpen(true);
	};

	const handleEdit = (perm: Permission) => {
		setEditingPermission(perm);
		setAction(perm.action);
		setResource(perm.resource);
		setDescription(perm.description || "");
		setOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (
			!confirm(
				"Are you sure? This will remove the permission from all roles."
			)
		)
			return;

		try {
			const res = await fetch(`/api/admin/permissions/${id}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast.success("Permission deleted");
				fetchPermissions();
			} else {
				toast.error("Failed to delete");
			}
		} catch (error) {
			toast.error("Error deleting permission");
		}
	};

	const handleSubmit = async () => {
		if (!action || !resource) {
			toast.error("Action and Resource are required");
			return;
		}

		setSubmitting(true);
		try {
			const url = editingPermission
				? `/api/admin/permissions/${editingPermission.id}`
				: "/api/admin/permissions";

			const method = editingPermission ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ action, resource, description }),
			});

			if (res.ok) {
				toast.success(
					editingPermission
						? "Permission updated"
						: "Permission created"
				);
				setOpen(false);
				fetchPermissions();
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to save");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Permissions</h1>
					<p className="text-muted-foreground">
						View and manage available system permissions.
					</p>
				</div>
				{canManage && (
					<Button onClick={handleCreate}>
						<Plus className="mr-2 size-4" />
						Add Permission
					</Button>
				)}
			</header>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Resource</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Description</TableHead>
							{canManage && (
								<TableHead className="text-right">
									Actions
								</TableHead>
							)}
						</TableRow>
					</TableHeader>
					<TableBody>
						{permissions.map((perm) => (
							<TableRow key={perm.id}>
								<TableCell className="font-medium capitalize">
									{perm.resource}
								</TableCell>
								<TableCell className="font-mono text-xs">
									{perm.action}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{perm.description}
								</TableCell>
								{canManage && (
									<TableCell className="text-right">
										<div className="flex justify-end gap-2">
											<Button
												variant="ghost"
												size="icon-sm"
												onClick={() => handleEdit(perm)}
											>
												<Edit className="size-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon-sm"
												className="text-destructive hover:text-destructive"
												onClick={() =>
													handleDelete(perm.id)
												}
											>
												<Trash2 className="size-4" />
											</Button>
										</div>
									</TableCell>
								)}
							</TableRow>
						))}
						{!loading && permissions.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={canManage ? 4 : 3}
									className="h-24 text-center"
								>
									No permissions found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{editingPermission
								? "Edit Permission"
								: "Add Permission"}
						</DialogTitle>
						<DialogDescription>
							Define a new capability (e.g., "create:users").
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Resource</Label>
								<Input
									placeholder="e.g. users"
									value={resource}
									onChange={(e) =>
										setResource(
											e.target.value.toLowerCase()
										)
									}
								/>
							</div>
							<div className="space-y-2">
								<Label>Action</Label>
								<Input
									placeholder="e.g. create"
									value={action}
									onChange={(e) =>
										setAction(e.target.value.toLowerCase())
									}
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label>Description</Label>
							<Input
								placeholder="Optional description"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={submitting}>
							{submitting ? "Saving..." : "Save"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
