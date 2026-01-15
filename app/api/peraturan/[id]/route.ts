import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import { deleteItemFromSiteDrive } from "@/lib/sharepoint";

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

		// Get documents from document table (if using new system)
		const documents = await prisma.document.findMany({
			where: {
				ref_type: "REGULATION_DOCUMENT",
				ref_id: id,
			},
		});

		// Get Microsoft Access Token for SharePoint deletion
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
		});

		const siteId = process.env.SP_SITE_ID;

		// Delete files from SharePoint if we have access token
		if (account?.accessToken && siteId) {
			// Delete files from document table entries
			for (const doc of documents) {
				if (doc.sp_item_id) {
					try {
						await deleteItemFromSiteDrive({
							siteId,
							accessToken: account.accessToken,
							itemId: doc.sp_item_id,
						});
						console.log(`Deleted SharePoint file: ${doc.file_name}`);
					} catch (error) {
						console.error(`Failed to delete SharePoint file ${doc.file_name}:`, error);
						// Continue with other files even if one fails
					}
				}
			}

			// Delete files from regulation_file table entries (old system)
			for (const file of existingRegulation.files) {
				if (file.sp_item_id) {
					try {
						await deleteItemFromSiteDrive({
							siteId,
							accessToken: account.accessToken,
							itemId: file.sp_item_id,
						});
						console.log(`Deleted SharePoint file: ${file.file_name}`);
					} catch (error) {
						console.error(`Failed to delete SharePoint file ${file.file_name}:`, error);
						// Continue with other files even if one fails
					}
				}
			}
		}

		// Delete document records from document table
		await prisma.document.deleteMany({
			where: {
				ref_type: "REGULATION_DOCUMENT",
				ref_id: id,
			},
		});

		// Delete regulation (cascade will delete files from regulation_file table)
		await prisma.regulation_document.delete({
			where: { id },
		});

		return NextResponse.json({
			message: "Regulation and associated files deleted successfully",
		});
	} catch (error) {
		console.error("Error deleting regulation:", error);
		return NextResponse.json(
			{ error: "Failed to delete regulation" },
			{ status: 500 }
		);
	}
}
