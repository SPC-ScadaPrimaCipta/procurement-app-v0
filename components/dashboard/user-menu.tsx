"use client";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";

export function UserMenu() {
	const router = useRouter();
	const { data: session } = authClient.useSession();

	const user = session?.user;

	const initials = user?.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.slice(0, 2)
				.toUpperCase()
		: "U";

	const handleLogout = async () => {
		await authClient.signOut();
		router.push("/auth/login");
		router.refresh();
	};

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger>
						<Avatar className="cursor-pointer">
							<AvatarImage src={user?.image || undefined} />
							<AvatarFallback suppressHydrationWarning>
								{initials}
							</AvatarFallback>
						</Avatar>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>
					<p>User Menu</p>
				</TooltipContent>
			</Tooltip>

			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>
					<div className="flex flex-col">
						<span className="font-medium">{user?.name}</span>
						<span className="text-xs text-muted-foreground">
							{user?.email}
						</span>
					</div>
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={() => router.push("/settings/profile")}
				>
					<User className="mr-2 h-4 w-4" />
					<span>Profile</span>
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem
					onClick={handleLogout}
					className="text-red-600"
				>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Logout</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
