import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dispositionAction = await prisma.master_disposition_action.findMany({
            where: {
                is_active: true,
            },
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
            },
        });

        return NextResponse.json(dispositionAction);
    } catch (error) {
        console.error("Error fetching disposition action:", error);
        return NextResponse.json(
            { error: "Failed to fetch disposition action" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const data: any = {
            ...body,
            created_by: session.user.id,
        };

        if (data.is_active === undefined) data.is_active = true;
        if (data.sort_order === undefined) data.sort_order = 0;

        const newValue = await prisma.master_disposition_action.create({
            data,
            select: {
                id: true,
                name: true,
                is_active: true,
                sort_order: true,
            },
        });

        return NextResponse.json(newValue, { status: 201 });

    } catch (error) {
        console.error("Error creating disposition action:", error);
        return NextResponse.json(
            { error: "Failed to create disposition action" },
            { status: 500 },
        );
    }
}
