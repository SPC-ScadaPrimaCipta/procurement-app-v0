import prisma from "@/lib/prisma";

/**
 * Resolves a user ID to a user name.
 * If the user is not found or an error occurs, returns the original ID.
 *
 * @param userId The ID of the user to resolve
 * @returns The user's name or the original ID
 */
export async function resolveUserName(userId: string): Promise<string> {
	if (!userId) return "";

	try {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { name: true },
		});

		return user?.name ?? userId;
	} catch (error) {
		// Log error if needed, but for safe fallback return userId
		console.warn(`Failed to resolve user name for ID ${userId}`, error);
		return userId;
	}
}
