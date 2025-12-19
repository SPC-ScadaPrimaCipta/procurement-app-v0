import { NextResponse } from "next/server";
import { DYNAMIC_RESOLVERS } from "@/lib/workflow/dynamic-registry";

export async function GET() {
	const result = Object.entries(DYNAMIC_RESOLVERS).map(([key, def]) => ({
		key,
		label: def.label,
		description: def.description,
	}));

	return NextResponse.json(result);
}
