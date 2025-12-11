import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/rbac";

export async function POST(
	req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;

	// 'manage:users' implies security control
	const canManageUser = await hasPermission("manage", "users");
	if (!canManageUser) return new NextResponse("Forbidden", { status: 403 });

	try {
		// Delete all sessions belonging to this user
		await prisma.session.deleteMany({
			where: { userId: id },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Revoke error", error);
		return new NextResponse("Failed to revoke sessions", { status: 500 });
	}
}
