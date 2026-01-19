import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const procurementMethod = await prisma.master_procurement_method.findMany({
            orderBy: {
                sort_order: "asc",
            },
            select: {
                id: true,
                name: true,
                is_active: true,
                sort_order: true,
                created_at: true,
            },
        });

        return NextResponse.json(procurementMethod);
    } catch (error) {
        console.error("Error fetching supplier types:", error);
        return NextResponse.json(
            { error: "Failed to fetch supplier types" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
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

        const body = await request.json();

		// Get next sort_order
		const maxOrderRecord = await prisma.master_procurement_method.findFirst({
			orderBy: { sort_order: "desc" },
			select: { sort_order: true },
		});
		const nextOrder = (maxOrderRecord?.sort_order ?? 0) + 1;

		const data: any = {
			...body,
			sort_order: nextOrder,
			created_by: session.user.id,
		};

		if (data.is_active === undefined) data.is_active = true;

		const existing = await prisma.master_procurement_method.findUnique({
			where: { name: data.name },
		});

		if (existing) {
            return NextResponse.json(
                { error: `Procurement method '${data.name}' already exists.` },
                { status: 409 }, // Conflict
            );
        }

        const newValue = await prisma.master_procurement_method.create({
            data,
            select: {
                id: true,
                name: true,
                is_active: true,
                sort_order: true,
            },
        });

        return NextResponse.json(newValue, { status: 201 });

    } catch (error: any) {
        console.error("Error creating procurement method:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: `Procurement method already exists (duplicate '${error.meta?.target}')` },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: "Failed to create procurement method" },
            { status: 500 },
        );
    }
}

