import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: Request, { params }: any) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // resolve params if it's a promise in some runtimes
        let resolvedParams = params;
        if (params && typeof params.then === "function") {
            try {
                resolvedParams = await params;
            } catch (e) {
                // ignore
            }
        }

        let docId = resolvedParams?.id;
        if (!docId) {
            try {
                const url = new URL(request.url);
                const parts = url.pathname.split("/").filter(Boolean);
                docId = parts[parts.length - 2];
            } catch (e) {
                // ignore
            }
        }

        if (!docId) {
            return NextResponse.json({ error: "Missing document id" }, { status: 400 });
        }

        const doc = await prisma.document.findUnique({
            where: { id: docId },
            select: { file_url: true },
        });

        if (!doc) {
            return NextResponse.json({ error: "Not Found" }, { status: 404 });
        }

        if (!doc.file_url) {
            return NextResponse.json({ error: "No file URL available" }, { status: 404 });
        }

        // Redirect the client to the storage URL
        return NextResponse.redirect(doc.file_url);
    } catch (error) {
        console.error("Error redirecting to document file_url:", error);
        return NextResponse.json({ error: "Failed to redirect" }, { status: 500 });
    }
}
