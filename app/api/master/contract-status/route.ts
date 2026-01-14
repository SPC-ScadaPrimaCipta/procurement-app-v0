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

        const contractStatus = await prisma.master_contract_status.findMany({
            orderBy: {
                name: "asc",
            },
            select: {
                id: true,
                name: true,
                is_active: true,
                sort_order: true,
                created_at: true,
            },
        });

        return NextResponse.json(contractStatus);
    } catch (error) {
        console.error("Error fetching contract status:", error);
        return NextResponse.json(
            { error: "Failed to fetch contract status" },
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

        const existing = await prisma.master_contract_status.findUnique({
            where: { name: data.name },
        });

        if (existing) {
            return NextResponse.json(
                { error: `Status '${data.name}' already exists.` },
                { status: 409 } // conflict
            );
        }

        const newValue = await prisma.master_contract_status.create({
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
        console.error("Error creating contract status:", error);

        if (error.code === "P2002") {
            return NextResponse.json(
                { error: `Status '${error.meta?.target}' already exists.` },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Failed to create contract status" },
            { status: 500 },
        );
    }
}
