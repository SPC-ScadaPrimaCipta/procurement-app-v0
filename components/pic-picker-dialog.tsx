"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, User as UserIcon, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface User {
	id: string;
	name: string;
	email: string;
	image?: string;
}

interface PicPickerDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onAssign: (user: User) => void;
}

export function PicPickerDialog({
	isOpen,
	onClose,
	onAssign,
}: PicPickerDialogProps) {
	const [search, setSearch] = useState("");
	const [users, setUsers] = useState<User[]>([]);
	const [loading, setLoading] = useState(false);

	const [debouncedSearch, setDebouncedSearch] = useState(search);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 500);
		return () => clearTimeout(timer);
	}, [search]);

	useEffect(() => {
		if (isOpen) {
			// Reset state on open if needed, or keep previous search
			if (!search) setUsers([]);
		}
	}, [isOpen]);

	useEffect(() => {
		if (isOpen && debouncedSearch) {
			setLoading(true);
			fetch(
				`/api/admin/list-users?search=${encodeURIComponent(debouncedSearch)}`,
			)
				.then((res) => res.json())
				.then((data) => {
					// The new API returns { users: [...], total: ... }
					if (data && Array.isArray(data.users)) setUsers(data.users);
					else setUsers([]);
				})
				.catch((err) => {
					console.error(err);
					setUsers([]);
				})
				.finally(() => setLoading(false));
		} else if (!debouncedSearch) {
			setUsers([]);
		}
	}, [debouncedSearch, isOpen]);

	return (
		<Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Assign PIC</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 pt-4">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search user by name or email..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					<div className="min-h-[200px] max-h-[300px] overflow-y-auto space-y-1 rounded-md border p-2">
						{loading && (
							<div className="flex h-full items-center justify-center p-4 text-muted-foreground">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Loading...
							</div>
						)}
						{!loading && users.length === 0 && debouncedSearch && (
							<div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
								No users found
							</div>
						)}
						{!loading && users.length === 0 && !debouncedSearch && (
							<div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
								Type to search users...
							</div>
						)}
						{users.map((user) => (
							<div
								key={user.id}
								className="flex items-center gap-3 p-2 hover:bg-muted rounded-md cursor-pointer transition-colors"
								onClick={() => onAssign(user)}
							>
								<Avatar className="h-8 w-8">
									<AvatarImage src={user.image} />
									<AvatarFallback>
										<UserIcon className="h-4 w-4" />
									</AvatarFallback>
								</Avatar>
								<div className="overflow-hidden">
									<div className="font-medium text-sm truncate">
										{user.name}
									</div>
									<div className="text-xs text-muted-foreground truncate">
										{user.email}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
