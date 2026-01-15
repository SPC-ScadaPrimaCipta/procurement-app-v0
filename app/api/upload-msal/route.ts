// NOT USED

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
	ensureFolderPathOnSiteDrive,
	uploadFileToSiteDrive,
} from "@/lib/sharepoint";

export async function POST(request: NextRequest) {
	// 1) ensure user logged in to app (BetterAuth)
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	// 2) get Graph access token from client
	const accessToken = request.headers.get("x-ms-graph-token");
	if (!accessToken) {
		return NextResponse.json(
			{ error: "Missing Graph token" },
			{ status: 400 }
		);
	}

	const siteId = process.env.SHAREPOINT_SITE_ID;
	if (!siteId) {
		return NextResponse.json(
			{ error: "SHAREPOINT_SITE_ID not configured" },
			{ status: 500 }
		);
	}

	// 3) parse form-data
	const formData = await request.formData();
	const file = formData.get("file") as File | null;
	const folderPath =
		(formData.get("folder_path") as string) || "General/Uploads";

	if (!file) {
		return NextResponse.json({ error: "No file" }, { status: 400 });
	}

	// 4) ensure folder
	await ensureFolderPathOnSiteDrive({ siteId, accessToken, folderPath });

	// 5) upload
	const spFile = await uploadFileToSiteDrive({
		siteId,
		accessToken,
		folderPath,
		file,
	});

	return NextResponse.json({
		name: spFile.name,
		url: spFile.webUrl,
		size: spFile.size,
		itemId: spFile.id,
	});
}
