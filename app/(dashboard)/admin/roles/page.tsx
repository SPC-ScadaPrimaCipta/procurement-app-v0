"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Plus, Shield, Trash2, Edit, Loader2 } from "lucide-react";

import { RoleForm } from "@/components/admin/role-form";
import { AdminRolesSkeleton } from "@/components/skeletons";
import { toast } from "sonner";
import { useRequirePermission } from "@/hooks/use-require-permission";

interface Role {
	id: string;
	name: string;
	description: string | null;
	permissions: {
		id: string;
		action: string;
		resource: string;
		description: string | null;
	}[];
	_count?: {
		users: number;
		permissions: number;
	};
}

export default function RolesPage() {
	const { isAuthorized, isLoading: authLoading } = useRequirePermission(
		"read",
		"roles"
	);

	const { isAuthorized: canManage } = useRequirePermission(
		"manage",
		"roles",
		{ redirect: false }
	);

	const [roles, setRoles] = useState<Role[]>([]);
	const [loading, setLoading] = useState(true);
	const [isInitialLoading, setIsInitialLoading] = useState(true);
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingRole, setEditingRole] = useState<Role | null>(null);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsInitialLoading(false);
		}, 300);
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		if (isAuthorized) {
			fetchRoles();
		}
	}, [isAuthorized]);

	const fetchRoles = async () => {
		try {
			const res = await fetch("/api/admin/roles");
			const data = await res.json();
			setRoles(data);
		} catch (error) {
			console.error("Failed to fetch roles", error);
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
		return <AdminRolesSkeleton />;
	}

	const handleCreate = () => {
		setEditingRole(null);
		setIsFormOpen(true);
	};

	const handleEdit = (role: Role) => {
		setEditingRole(role);
		setIsFormOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this role?")) return;

		try {
			const res = await fetch(`/api/admin/roles/${id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				toast.success("Role deleted");
				fetchRoles();
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to delete role");
			}
		} catch (error) {
			toast.error("Failed to delete role");
		}
	};

	return (
		<div className="space-y-6 animate-in fade-in duration-300">
			<header className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Roles</h1>
					<p className="text-muted-foreground">
						Manage system roles and their permissions.
					</p>
				</div>
				{canManage && (
					<Button onClick={handleCreate}>
						<Plus className="mr-2 size-4" />
						Create Role
					</Button>
				)}
			</header>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{roles.map((role) => (
					<Card key={role.id}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{role.name}
							</CardTitle>
							<Shield className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">
								{role._count?.users || 0}
							</div>
							<p className="text-xs text-muted-foreground">
								Users assigned
							</p>
							<p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-10">
								{role.description || "No description provided."}
							</p>
							{canManage && (
								<div className="mt-4 flex justify-end gap-2">
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => handleEdit(role)}
									>
										<Edit className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon-sm"
										className="text-destructive hover:text-destructive"
										onClick={() => handleDelete(role.id)}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			<RoleForm
				open={isFormOpen}
				setOpen={setIsFormOpen}
				initialData={editingRole as any} // Cast safely as permission structure matches
				onSuccess={fetchRoles}
			/>
		</div>
	);
}
