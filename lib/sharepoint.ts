export function sanitizeFileName(fileName: string) {
	return fileName
		.replace(/[<>:"/\\|?*#%+&'{}[\]^`~]/g, " ")
		.trim()
		.replace(/\s+/g, " ");
}

export async function ensureFolderPathOnSiteDrive(params: {
	siteId: string;
	accessToken: string;
	folderPath: string; // e.g. "Emergency Incidents/INC-0001"
}) {
	// Create folders one by one using children endpoint
	const parts = params.folderPath.split("/").filter(Boolean);
	let current = "";

	for (const part of parts) {
		const parent = current;
		const parentPathEncoded = parent
			? parent.split("/").map(encodeURIComponent).join("/")
			: "";

		const url = parent
			? `https://graph.microsoft.com/v1.0/sites/${params.siteId}/drive/root:/${parentPathEncoded}:/children`
			: `https://graph.microsoft.com/v1.0/sites/${params.siteId}/drive/root/children`;

		console.log(
			`[SharePoint] Ensuring folder: ${part} in ${parent || "root"}`
		);

		const res = await fetch(url, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${params.accessToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				name: part,
				folder: {},
				"@microsoft.graph.conflictBehavior": "fail",
			}),
		});

		// 201 created is ok
		if (res.ok) {
			current = current ? `${current}/${part}` : part;
			continue;
		}

		// 409 means it already exists
		if (res.status === 409) {
			current = current ? `${current}/${part}` : part;
			continue;
		}

		const txt = await res.text();
		console.error(`[SharePoint] ensureFolder failed: ${res.status} ${txt}`);
		throw new Error(`ensureFolder failed ${res.status}: ${txt}`);
	}
}

export async function uploadFileToSiteDrive(params: {
	siteId: string;
	accessToken: string;
	folderPath: string; // "Emergency Incidents/INC-0001"
	file: File;
}) {
	const cleanName = sanitizeFileName(params.file.name);
	const fullPath = `${
		params.folderPath ? params.folderPath + "/" : ""
	}${cleanName}`;
	const encodedPath = fullPath.split("/").map(encodeURIComponent).join("/");

	const token_payload = JSON.parse(
		Buffer.from(params.accessToken.split(".")[1], "base64").toString("utf8")
	);
	console.log("scp", token_payload.scp);

	const arrayBuffer = await params.file.arrayBuffer();
	const buffer = Buffer.from(arrayBuffer);

	const uploadUrl = `https://graph.microsoft.com/v1.0/sites/${params.siteId}/drive/root:/${encodedPath}:/content`;

	console.log(`[SharePoint] Uploading to: ${fullPath}`);

	const res = await fetch(uploadUrl, {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${params.accessToken}`,
			"Content-Type": params.file.type || "application/octet-stream",
		},
		body: buffer,
	});

	if (!res.ok) {
		const txt = await res.text();
		throw new Error(`SharePoint upload failed ${res.status}: ${txt}`);
	}

	const data = await res.json();
	return {
		webUrl: data.webUrl as string,
		name: data.name as string,
		size: (data.size as number) ?? buffer.length,
		id: data.id as string, // itemId
	};
}

export async function deleteItemFromSiteDrive(params: {
	siteId: string;
	accessToken: string;
	itemId: string;
}) {
	const url = `https://graph.microsoft.com/v1.0/sites/${params.siteId}/drive/items/${params.itemId}`;
	const res = await fetch(url, {
		method: "DELETE",
		headers: { Authorization: `Bearer ${params.accessToken}` },
	});

	if (res.status === 204 || res.status === 404) return; // ok (404 means already gone)
	const txt = await res.text();
	throw new Error(`SharePoint delete failed ${res.status}: ${txt}`);
}
