import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(
    request: Request,
        { params }: any
    ) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // `params` may be a Promise in some Next.js runtimes — await if needed
        let resolvedParams = params;
        if (params && typeof params.then === "function") {
            try {
                resolvedParams = await params;
            } catch (e) {
                // leave resolvedParams as-is
            }
        }

        // try to get id from resolved params or fallback to URL parsing
        let docId = resolvedParams?.id;
        if (!docId) {
            try {
                const url = new URL(request.url);
                const parts = url.pathname.split("/").filter(Boolean);
                docId = parts[parts.length - 1];
            } catch (e) {
                // ignore
            }
        }

        if (!docId) {
            console.error("Missing document id in request", { resolvedParams, url: request.url });
            return NextResponse.json({ error: "Missing document id" }, { status: 400 });
        }

        console.log("Fetching document id=", docId);

        const doc = await prisma.document.findUnique({
            where: { id: docId },
            select: {
                    id: true,
                    title: true,
                    doc_date: true,
                    file_name: true,
                    ref_type: true,
                    file_url: true,
                    folder_path: true,
                    uploaded_at: true,
                    uploaded_by: true,
                    master_doc_type: {
                    select: { name: true },
                },
            },
        });

        if (!doc) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        const formatted = {
            id: doc.id,
            doc_name: doc.master_doc_type?.name || null,
            title: doc.title,
            doc_date: doc.doc_date,
            file_name: doc.file_name,
            file_url: doc.file_url,
            uploaded_at: doc.uploaded_at,
            folder_path: doc.folder_path,
            ref_type: doc.ref_type
        };

        // Lookup uploader name if available
        let uploaded_by_name: string | null = null;
        try {
            if (doc.uploaded_by) {
                const user = await prisma.user.findUnique({ where: { id: doc.uploaded_by }, select: { name: true } });
                uploaded_by_name = user?.name ?? null;
            }
        } catch (e) {
            // ignore
        }

        // attach uploader info
        (formatted as any).uploaded_by = doc.uploaded_by;
        (formatted as any).uploaded_by_name = uploaded_by_name;

        return NextResponse.json(formatted);
    } catch (error) {
            console.error("Error fetching document detail:", error);
        return NextResponse.json(
            { error: "Failed to fetch document detail" },
            { status: 500 }
        );
    }
}
