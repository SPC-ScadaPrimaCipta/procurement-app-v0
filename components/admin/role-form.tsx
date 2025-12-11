"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Permission {
	id: string;
	action: string;
	resource: string;
	description: string | null;
}

interface RoleFormProps {
	open: boolean;
	setOpen: (open: boolean) => void;
	initialData?: {
		id: string;
		name: string;
		description: string;
		permissions: Permission[];
	} | null;
	onSuccess?: () => void;
}

export function RoleForm({
	open,
	setOpen,
	initialData,
	onSuccess,
}: RoleFormProps) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
		[]
	);
	const [availablePermissions, setAvailablePermissions] = useState<
		Permission[]
	>([]);
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			fetchPermissions();
			if (initialData) {
				setName(initialData.name);
				setDescription(initialData.description || "");
				setSelectedPermissions(
					initialData.permissions.map((p) => p.id)
				);
			} else {
				setName("");
				setDescription("");
				setSelectedPermissions([]);
			}
		}
	}, [open, initialData]);

	const fetchPermissions = async () => {
		try {
			const res = await fetch("/api/admin/permissions");
			const data = await res.json();
			setAvailablePermissions(data);
		} catch (error) {
			console.error("Failed to fetch permissions", error);
			toast.error("Failed to load permissions");
		}
	};

	const handleSubmit = async () => {
		if (!name) return toast.error("Role name is required");

		setSubmitting(true);
		try {
			const url = initialData
				? `/api/admin/roles/${initialData.id}`
				: "/api/admin/roles";
			const method = initialData ? "PUT" : "POST";

			const res = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name,
					description,
					permissionIds: selectedPermissions,
				}),
			});

			if (res.ok) {
				toast.success(initialData ? "Role updated" : "Role created");
				setOpen(false);
				if (onSuccess) onSuccess();
			} else {
				const err = await res.json();
				toast.error(err.message || "Failed to save role");
			}
		} catch (error) {
			console.error(error);
			toast.error("An error occurred");
		} finally {
			setSubmitting(false);
		}
	};

	const togglePermission = (id: string) => {
		setSelectedPermissions((prev) =>
			prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{initialData ? "Edit Role" : "Create Role"}
					</DialogTitle>
					<DialogDescription>
						Define the role name and assign permissions.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="name">Role Name</Label>
						<Input
							id="name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Content Manager"
						/>
					</div>
					<div className="grid gap-2">
						<Label htmlFor="desc">Description</Label>
						<Input
							id="desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Describe the role's responsibilities"
						/>
					</div>

					<div className="space-y-2">
						<Label>Permissions</Label>
						<div className="border rounded-md p-4 h-60 overflow-y-auto">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{availablePermissions.map((perm) => (
									<div
										key={perm.id}
										className="flex items-start space-x-2"
									>
										<Checkbox
											id={perm.id}
											checked={selectedPermissions.includes(
												perm.id
											)}
											onCheckedChange={() =>
												togglePermission(perm.id)
											}
										/>
										<div className="grid gap-1.5 leading-none">
											<Label
												htmlFor={perm.id}
												className="cursor-pointer font-medium"
											>
												{perm.action} {perm.resource}
											</Label>
											<p className="text-xs text-muted-foreground">
												{perm.description ||
													"No description"}
											</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={submitting}>
						{submitting ? "Saving..." : "Save Role"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
