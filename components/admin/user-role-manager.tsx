"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield } from "lucide-react";
import { toast } from "sonner";

interface Role {
	id: string;
	name: string;
}

interface UserRoleManagerProps {
	userId: string;
	currentRoles: string[]; // Names of current roles
	onUpdate?: () => void;
}

export function UserRoleManager({
	userId,
	currentRoles,
	onUpdate,
}: UserRoleManagerProps) {
	const [open, setOpen] = useState(false);
	const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
	const [selectedRoles, setSelectedRoles] = useState<string[]>(currentRoles);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			fetchRoles();
			setSelectedRoles(currentRoles);
		}
	}, [open, currentRoles]);

	const fetchRoles = async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/admin/roles");
			if (res.ok) {
				const data = await res.json();
				setAvailableRoles(data);
			}
		} catch (error) {
			console.error("Failed to fetch roles", error);
			toast.error("Failed to load roles");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ roles: selectedRoles }),
			});

			if (!res.ok) throw new Error("Failed to update roles");

			toast.success("Roles updated successfully");
			setOpen(false);
			if (onUpdate) onUpdate();
		} catch (error) {
			console.error(error);
			toast.error("Failed to update roles");
		} finally {
			setSaving(false);
		}
	};

	const toggleRole = (roleName: string) => {
		setSelectedRoles((prev) =>
			prev.includes(roleName)
				? prev.filter((r) => r !== roleName)
				: [...prev, roleName]
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<div onClick={(e) => e.stopPropagation()} className="w-full">
					<Button
						variant="ghost"
						size="sm"
						className="w-full justify-start h-8 px-2"
					>
						<Shield className="mr-2 size-4" />
						Manage Roles
					</Button>
				</div>
			</DialogTrigger>
			<DialogContent onClick={(e) => e.stopPropagation()}>
				<DialogHeader>
					<DialogTitle>Manage Roles</DialogTitle>
					<DialogDescription>
						Assign roles to this user. They will inherit permissions
						from all assigned roles.
					</DialogDescription>
				</DialogHeader>
				<div className="py-4 space-y-4">
					{loading ? (
						<div className="text-center text-sm text-muted-foreground">
							Loading roles...
						</div>
					) : (
						<div className="grid gap-2">
							{availableRoles.map((role) => (
								<div
									key={role.id}
									className="flex items-center space-x-2"
								>
									<Checkbox
										id={`role-${role.id}`}
										checked={selectedRoles.includes(
											role.name
										)}
										onCheckedChange={() =>
											toggleRole(role.name)
										}
									/>
									<Label
										htmlFor={`role-${role.id}`}
										className="capitalize cursor-pointer"
									>
										{role.name}
									</Label>
								</div>
							))}
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Cancel
					</Button>
					<Button onClick={handleSave} disabled={saving || loading}>
						{saving ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
