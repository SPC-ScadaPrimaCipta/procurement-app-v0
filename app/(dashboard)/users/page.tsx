"use client";

import { useEffect, useState } from "react";
import { UserRoleManager } from "@/components/admin/user-role-manager";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/ui/password-input";
import {
	Ban,
	Edit,
	MoreHorizontal,
	Trash2,
	ShieldOff,
	Search,
	Loader2,
	Shield,
	Plus,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Basic types
interface Role {
	id: string;
	name: string;
	description: string | null;
}

interface User {
	id: string;
	name: string;
	email: string;
	image: string | null;
	createdAt: string;
	banned: boolean;
	roles: Role[];
}

export default function UsersPage() {
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const limit = 10;

	// Edit User Dialog
	const [editingUser, setEditingUser] = useState<User | null>(null);
	const [editName, setEditName] = useState("");
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [saving, setSaving] = useState(false);

	// Create User Dialog
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [creating, setCreating] = useState(false);
	const [createForm, setCreateForm] = useState({
		name: "",
		email: "",
		password: "",
		role: "user",
	});

	useEffect(() => {
		fetchUsers();
	}, [search, page]);

	const fetchUsers = async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				limit: limit.toString(),
				offset: (page * limit).toString(),
				search: search,
			});
			const res = await fetch(`/api/admin/list-users?${params}`);
			if (res.ok) {
				const data = await res.json();
				setUsers(data.users);
			} else {
				toast.error("Failed to load users");
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const handleBanUser = async (userId: string, isBanned: boolean) => {
		if (
			!confirm(
				`Are you sure you want to ${
					isBanned ? "unban" : "ban"
				} this user?`
			)
		)
			return;

		try {
			if (isBanned) {
				await authClient.admin.unbanUser({ userId });
				toast.success("User unbanned");
			} else {
				await authClient.admin.banUser({
					userId,
					banReason: "Admin action",
				});
				toast.success("User banned");
			}
			fetchUsers();
		} catch (error: any) {
			toast.error(error.message || "Action failed");
		}
	};

	const handleRevokeSessions = async (userId: string) => {
		if (!confirm("Revoke all active sessions for this user?")) return;
		try {
			const res = await fetch(`/api/admin/users/${userId}/revoke`, {
				method: "POST",
			});
			if (res.ok) toast.success("Sessions revoked");
			else toast.error("Failed to revoke sessions");
		} catch (e) {
			toast.error("Error revoking sessions");
		}
	};

	const handleDeleteUser = async (userId: string) => {
		if (
			!confirm(
				"Are you sure you want to PERMANENTLY delete this user? This action cannot be undone."
			)
		)
			return;
		try {
			const res = await fetch(`/api/admin/users/${userId}`, {
				method: "DELETE",
			});
			if (res.ok) {
				toast.success("User deleted");
				fetchUsers();
			} else {
				toast.error("Failed to delete user");
			}
		} catch (e) {
			toast.error("Error deleting user");
		}
	};

	const openEdit = (user: User) => {
		setEditingUser(user);
		setEditName(user.name);
		setIsEditOpen(true);
	};

	const handleSaveEdit = async () => {
		if (!editingUser) return;
		setSaving(true);
		try {
			const res = await fetch(`/api/admin/users/${editingUser.id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: editName }),
			});

			if (res.ok) {
				toast.success("User updated");
				setIsEditOpen(false);
				fetchUsers();
			} else {
				toast.error("Update failed");
			}
		} catch (err) {
			toast.error("Error updating user");
		} finally {
			setSaving(false);
		}
	};

	const handleCreateUser = async () => {
		if (!createForm.email || !createForm.password || !createForm.name) {
			toast.error("Please fill in all fields");
			return;
		}

		setCreating(true);
		try {
			const { data, error } = await authClient.admin.createUser({
				email: createForm.email,
				password: createForm.password,
				name: createForm.name,
				role: createForm.role,
			});

			if (error) {
				toast.error(error.message || "Failed to create user");
			} else {
				toast.success("User created successfully");
				setIsCreateOpen(false);
				setCreateForm({
					name: "",
					email: "",
					password: "",
					role: "user",
				});
				fetchUsers();
			}
		} catch (err: any) {
			toast.error(err.message || "Error creating user");
		} finally {
			setCreating(false);
		}
	};

	return (
		<div className="space-y-8">
			<header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold">Users</h1>
					<p className="text-muted-foreground">
						Manage roles, invitations, and account access.
					</p>
				</div>

				<div className="flex gap-2">
					<Button variant="outline" className="gap-2">
						<Shield className="size-4" />
						Access policies
					</Button>
					<Button
						className="gap-2"
						onClick={() => setIsCreateOpen(true)}
					>
						<Plus className="size-4" />
						Create User
					</Button>
				</div>
			</header>

			{/* Search */}
			<div className="flex w-full items-center space-x-2">
				<Input
					placeholder="Search users..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="max-w-xs"
				/>
				{loading && (
					<Loader2 className="animate-spin size-4 text-muted-foreground" />
				)}
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Roles</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users.map((user) => (
							<TableRow key={user.id}>
								<TableCell className="flex items-center gap-3">
									<Avatar className="size-8">
										<AvatarImage src={user.image || ""} />
										<AvatarFallback>
											{user.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className="flex flex-col">
										<span className="font-medium text-sm">
											{user.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{user.email}
										</span>
									</div>
								</TableCell>
								<TableCell>
									<div className="flex flex-wrap gap-1">
										{user.roles.length > 0 ? (
											user.roles.map((r) => (
												<Badge
													key={r.id}
													variant="secondary"
													className="text-xs font-normal"
												>
													{r.name}
												</Badge>
											))
										) : (
											<span className="text-xs text-muted-foreground">
												No roles
											</span>
										)}
									</div>
								</TableCell>
								<TableCell>
									{user.banned ? (
										<Badge variant="destructive">
											Banned
										</Badge>
									) : (
										<Badge
											variant="outline"
											className="text-green-600 border-green-200 bg-green-50"
										>
											Active
										</Badge>
									)}
								</TableCell>
								<TableCell className="text-muted-foreground text-xs">
									{format(
										new Date(user.createdAt),
										"MMM d, yyyy"
									)}
								</TableCell>
								<TableCell className="text-right">
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
											>
												<MoreHorizontal className="size-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuLabel>
												Actions
											</DropdownMenuLabel>
											<DropdownMenuItem
												onClick={() => openEdit(user)}
											>
												<Edit className="mr-2 size-4" />{" "}
												Edit Details
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<div className="">
												<UserRoleManager
													userId={user.id}
													currentRoles={user.roles.map(
														(r) => r.name
													)}
													onUpdate={fetchUsers}
												/>
											</div>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() =>
													handleRevokeSessions(
														user.id
													)
												}
											>
												<ShieldOff className="mr-2 size-4 text-orange-500" />{" "}
												Revoke Access
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() =>
													handleBanUser(
														user.id,
														user.banned
													)
												}
												className={
													user.banned
														? "text-green-600"
														: "text-destructive"
												}
											>
												<Ban className="mr-2 size-4" />{" "}
												{user.banned
													? "Unban User"
													: "Ban User"}
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={() =>
													handleDeleteUser(user.id)
												}
												className="text-destructive focus:text-destructive"
											>
												<Trash2 className="mr-2 size-4" />
												Delete User
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
						{!loading && users.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="h-24 text-center"
								>
									No users found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination Controls could go here */}

			{/* Edit User Dialog */}
			<Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Edit User</DialogTitle>
						<DialogDescription>
							Change user display name
						</DialogDescription>
					</DialogHeader>
					<div className="py-2">
						<Label>Name</Label>
						<Input
							value={editName}
							onChange={(e) => setEditName(e.target.value)}
						/>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsEditOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleSaveEdit} disabled={saving}>
							{saving ? "Saving..." : "Save Changes"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* Create User Dialog */}
			<Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create New User</DialogTitle>
						<DialogDescription>
							Add a new user to the system.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label>Name</Label>
							<Input
								placeholder="John Doe"
								value={createForm.name}
								onChange={(e) =>
									setCreateForm({
										...createForm,
										name: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Email</Label>
							<Input
								type="email"
								placeholder="john@example.com"
								value={createForm.email}
								onChange={(e) =>
									setCreateForm({
										...createForm,
										email: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Password</Label>
							<PasswordInput
								placeholder="Secure password"
								value={createForm.password}
								onChange={(e) =>
									setCreateForm({
										...createForm,
										password: e.target.value,
									})
								}
							/>
						</div>
						<div className="space-y-2">
							<Label>Role</Label>
							<Select
								value={createForm.role}
								onValueChange={(val) =>
									setCreateForm({ ...createForm, role: val })
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="user">User</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsCreateOpen(false)}
						>
							Cancel
						</Button>
						<Button onClick={handleCreateUser} disabled={creating}>
							{creating ? "Creating..." : "Create User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
