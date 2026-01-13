import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Get regulation detail
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		const regulation = await prisma.regulation_document.findUnique({
			where: { id },
			include: {
				type: {
					select: {
						name: true,
					},
				},
				files: {
					select: {
						id: true,
						file_name: true,
						mime_type: true,
						file_size: true,
						file_url: true,
						uploaded_at: true,
					},
					orderBy: {
						uploaded_at: "desc",
					},
				},
			},
		});

		if (!regulation) {
			return NextResponse.json(
				{ error: "Regulation not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(regulation);
	} catch (error) {
		console.error("Error fetching regulation:", error);
		return NextResponse.json(
			{ error: "Failed to fetch regulation" },
			{ status: 500 }
		);
	}
}

// PUT: Update regulation
export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();
		const { type_id, doc_number, title } = body;

		// Validate required fields
		if (!type_id || !doc_number || !title) {
			return NextResponse.json(
				{ error: "Type, document number, and title are required" },
				{ status: 400 }
			);
		}

		// Check if regulation exists
		const existingRegulation = await prisma.regulation_document.findUnique({
			where: { id },
		});

		if (!existingRegulation) {
			return NextResponse.json(
				{ error: "Regulation not found" },
				{ status: 404 }
			);
		}

		// Check for duplicate doc_number (excluding current regulation)
		if (doc_number !== existingRegulation.doc_number) {
			const duplicateRegulation = await prisma.regulation_document.findFirst({
				where: {
					doc_number,
					id: { not: id },
				},
			});

			if (duplicateRegulation) {
				return NextResponse.json(
					{ error: "Document number already exists" },
					{ status: 400 }
				);
			}
		}

		// Update regulation
		const regulation = await prisma.regulation_document.update({
			where: { id },
			data: {
				type_id,
				doc_number,
				title,
				updated_at: new Date(),
			},
			include: {
				type: {
					select: {
						name: true,
					},
				},
			},
		});

		return NextResponse.json(regulation);
	} catch (error) {
		console.error("Error updating regulation:", error);
		return NextResponse.json(
			{ error: "Failed to update regulation" },
			{ status: 500 }
		);
	}
}

// DELETE: Delete regulation
export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		// Check if regulation exists
		const existingRegulation = await prisma.regulation_document.findUnique({
			where: { id },
			include: {
				files: true,
			},
		});

		if (!existingRegulation) {
			return NextResponse.json(
				{ error: "Regulation not found" },
				{ status: 404 }
			);
		}

		// Delete regulation (cascade will delete files)
		await prisma.regulation_document.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Regulation deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting regulation:", error);
		return NextResponse.json(
			{ error: "Failed to delete regulation" },
			{ status: 500 }
		);
	}
}
