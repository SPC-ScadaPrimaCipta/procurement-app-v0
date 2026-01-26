import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Get URL search params
		const { searchParams } = new URL(request.url);
		const chartType = searchParams.get("type");

		switch (chartType) {
			case "kontrak-by-status":
				return await getKontrakByStatus();
			
			case "non-kontrak-by-status":
				return await getNonKontrakByStatus();
			
			case "kontrak-by-expense":
				return await getKontrakByExpense();
			
			case "vendor-by-type":
				return await getVendorByType();
			
			case "pic-kontrak":
				return await getPICKontrak();
			
			case "workflow-approval":
				return await getWorkflowApproval();
			
			default:
				return NextResponse.json(
					{ error: "Invalid chart type" },
					{ status: 400 }
				);
		}
	} catch (error) {
		console.error("Error fetching chart data:", error);
		return NextResponse.json(
			{ 
				error: "Failed to fetch chart data",
				details: error instanceof Error ? error.message : String(error)
			},
			{ status: 500 }
		);
	}
}

async function getKontrakByStatus() {
	const data = await prisma.contract.groupBy({
		by: ["contract_status_id"],
		_count: {
			id: true,
		},
	});

	const statusIds = data.map((item) => item.contract_status_id);
	const statuses = await prisma.master_contract_status.findMany({
		where: { id: { in: statusIds } },
		select: { id: true, name: true },
	});

	const result = data.map((item) => ({
		name: statuses.find((s) => s.id === item.contract_status_id)?.name || "Unknown",
		value: item._count.id,
	}));

	return NextResponse.json(result);
}

async function getNonKontrakByStatus() {
	const data = await prisma.procurement_case.groupBy({
		by: ["status_id"],
		_count: {
			id: true,
		},
		where: {
			contract: null, // Non-kontrak cases
		},
	});

	const statusIds = data.map((item) => item.status_id);
	const statuses = await prisma.case_status.findMany({
		where: { id: { in: statusIds } },
		select: { id: true, name: true },
	});

	const result = data.map((item) => ({
		name: statuses.find((s) => s.id === item.status_id)?.name || "Unknown",
		value: item._count.id,
	}));

	return NextResponse.json(result);
}

async function getKontrakByExpense() {
	const data = await prisma.contract.groupBy({
		by: ["expense_type"],
		_count: {
			id: true,
		},
	});

	const result = data.map((item) => ({
		name: item.expense_type,
		value: item._count.id,
	}));

	return NextResponse.json(result);
}

async function getVendorByType() {
	const data = await prisma.vendor.groupBy({
		by: ["supplier_type_id"],
		_count: {
			id: true,
		},
	});

	const typeIds = data.map((item) => item.supplier_type_id);
	const types = await prisma.master_supplier_type.findMany({
		where: { id: { in: typeIds } },
		select: { id: true, name: true },
	});

	const result = data.map((item) => ({
		name: types.find((t) => t.id === item.supplier_type_id)?.name || "Unknown",
		value: item._count.id,
	}));

	return NextResponse.json(result);
}

async function getPICKontrak() {
	// Get all procurement cases that have PIC (regardless of contract status)
	const casesWithPIC = await prisma.procurement_case.findMany({
		where: {
			pic: { not: null },
		},
		select: {
			id: true,
			pic: true,
		},
	});

	// Get unique PIC IDs
	const picIds = [...new Set(
		casesWithPIC
			.map((c) => c.pic)
			.filter((pic): pic is string => pic !== null)
	)];

	// Get user names for these PICs
	const users = await prisma.user.findMany({
		where: { id: { in: picIds } },
		select: { id: true, name: true },
	});

	// Create a map of userId -> userName
	const userMap = new Map(users.map((u) => [u.id, u.name]));

	// Count cases per PIC
	const picCount = new Map<string, number>();
	casesWithPIC.forEach((procCase) => {
		const picId = procCase.pic;
		if (picId) {
			const userName = userMap.get(picId) || picId;
			picCount.set(userName, (picCount.get(userName) || 0) + 1);
		}
	});

	const result = Array.from(picCount.entries())
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value)
		.slice(0, 10);

	return NextResponse.json(result);
}

async function getWorkflowApproval() {
	const approved = await prisma.workflow_action_log.count({
		where: { action: "APPROVE" },
	});

	const rejected = await prisma.workflow_action_log.count({
		where: { action: "REJECT" },
	});

	const result = [
		{ name: "Approved", value: approved },
		{ name: "Rejected", value: rejected },
	];

	return NextResponse.json(result);
}
