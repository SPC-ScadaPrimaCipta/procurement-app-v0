import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import {
	uploadFileToSiteDrive,
	ensureFolderPathOnSiteDrive,
} from "@/lib/sharepoint";

export const dynamic = "force-dynamic";

// POST: Upload document for regulation using document table
export async function POST(
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

		const { id: regulationId } = await params;

		// Check if regulation exists
		const regulation = await prisma.regulation_document.findUnique({
			where: { id: regulationId },
			include: {
				type: true,
			},
		});

		if (!regulation) {
			return NextResponse.json(
				{ error: "Regulation not found" },
				{ status: 404 }
			);
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Get Microsoft Access Token
		const account = await prisma.account.findFirst({
			where: {
				userId: session.user.id,
				providerId: "microsoft",
			},
		});

		if (!account?.accessToken) {
			return NextResponse.json(
				{
					error: "No Microsoft account linked or access token missing.",
				},
				{ status: 400 }
			);
		}

		const accessToken = account.accessToken;
		const siteId = process.env.SP_SITE_ID;

		if (!siteId) {
			return NextResponse.json(
				{
					error: "SharePoint Site ID not configured.",
				},
				{ status: 500 }
			);
		}

		// Get PERATURAN doc type from master_doc_type
		const peraturanDocType = await prisma.master_doc_type.findFirst({
			where: {
				name: "PERATURAN",
				is_active: true,
			},
		});

		if (!peraturanDocType) {
			return NextResponse.json(
				{ error: "PERATURAN document type not found in master data" },
				{ status: 404 }
			);
		}

		// Normalize doc_number for folder path (e.g., "777 TAHUN 2019" -> "777 Tahun 2019")
		const normalizedDocNumber = regulation.doc_number
			.split(' ')
			.map((word, index) => {
				// Capitalize first letter of "TAHUN" or "tahun"
				if (word.toLowerCase() === 'tahun') {
					return 'Tahun';
				}
				return word;
			})
			.join(' ');

		// Upload file to SharePoint with structure: Peraturan/777 Tahun 2019/
		const folderPath = `Peraturan/${normalizedDocNumber}`;

		// Ensure folder exists
		try {
			await ensureFolderPathOnSiteDrive({
				siteId,
				accessToken,
				folderPath,
			});
		} catch (error: any) {
			console.error("Failed to ensure folder path:", error);
			return NextResponse.json(
				{ error: `Failed to create folder: ${error.message}` },
				{ status: 502 }
			);
		}

		// Upload to SharePoint
		const spFile = await uploadFileToSiteDrive({
			siteId,
			accessToken,
			folderPath,
			file,
		});

		// Save document record to database using document table
		const document = await prisma.document.create({
			data: {
				ref_type: "REGULATION_DOCUMENT",
				ref_id: regulationId,
				doc_type_id: peraturanDocType.id,
				title: regulation.title,
				doc_number: regulation.doc_number,
				doc_date: new Date(),
				step_id: null,
				version_no: 1,
				is_latest: true,
				file_name: spFile.name,
				mime_type: file.type,
				file_size: BigInt(spFile.size),
				file_url: spFile.webUrl,
				folder_path: folderPath,
				sp_item_id: spFile.id,
				uploaded_by: session.user.id,
			},
		});

		return NextResponse.json(
			{
				...document,
				file_size: document.file_size?.toString(),
			},
			{ status: 201 }
		);
	} catch (error: any) {
		console.error("Error uploading document:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to upload document" },
			{ status: 500 }
		);
	}
}

// GET: Get all documents for regulation from document table
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

		const { id: regulationId } = await params;

		// Check if regulation exists
		const regulation = await prisma.regulation_document.findUnique({
			where: { id: regulationId },
		});

		if (!regulation) {
			return NextResponse.json(
				{ error: "Regulation not found" },
				{ status: 404 }
			);
		}

		// Get all documents for this regulation
		const documents = await prisma.document.findMany({
			where: {
				ref_type: "REGULATION_DOCUMENT",
				ref_id: regulationId,
			},
			include: {
				master_doc_type: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				uploaded_at: "desc",
			},
		});

		// Convert BigInt to string for JSON serialization
		const documentsWithStringSize = documents.map((doc) => ({
			...doc,
			file_size: doc.file_size?.toString(),
		}));

		return NextResponse.json(documentsWithStringSize);
	} catch (error) {
		console.error("Error fetching documents:", error);
		return NextResponse.json(
			{ error: "Failed to fetch documents" },
			{ status: 500 }
		);
	}
}
