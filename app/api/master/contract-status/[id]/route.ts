import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const canManage = await hasPermission("manage", "masterData");
		if (!canManage) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();

		// Check if exists
		const existing = await prisma.master_contract_status.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Status kontrak tidak ditemukan" },
				{ status: 404 }
			);
		}

		// Check if name is unique (excluding current record)
		if (body.name && body.name !== existing.name) {
			const duplicate = await prisma.master_contract_status.findFirst({
				where: {
					name: body.name,
					id: { not: id },
				},
			});

			if (duplicate) {
				return NextResponse.json(
					{ error: `Status '${body.name}' sudah ada` },
					{ status: 409 }
				);
			}
		}

		const updated = await prisma.master_contract_status.update({
			where: { id },
			data: {
				name: body.name,
				is_active: body.is_active ?? true,
				sort_order: body.sort_order ?? 0,
			},
		});

		return NextResponse.json(updated);
	} catch (error) {
		console.error("Error updating contract status:", error);
		return NextResponse.json(
			{ error: "Failed to update contract status" },
			{ status: 500 }
		);
	}
}

export async function DELETE(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const canManage = await hasPermission("manage", "masterData");
		if (!canManage) {
			return new NextResponse("Forbidden", { status: 403 });
		}

		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Check if exists
		const existing = await prisma.master_contract_status.findUnique({
			where: { id },
		});

		if (!existing) {
			return NextResponse.json(
				{ error: "Status kontrak tidak ditemukan" },
				{ status: 404 }
			);
		}

		await prisma.master_contract_status.delete({
			where: { id },
		});

		return NextResponse.json({ message: "Deleted successfully" });
	} catch (error) {
		console.error("Error deleting contract status:", error);
		return NextResponse.json(
			{ error: "Failed to delete contract status" },
			{ status: 500 }
		);
	}
}
