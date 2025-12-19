import { resolveRole } from "./role";
import { resolveUser } from "./user";
import { resolveDynamic } from "./dynamic";

export async function resolveMulti(
	value: string,
	context: any
): Promise<string[]> {
	const parts = value.split(",");
	const results = new Set<string>();

	for (const part of parts) {
		const [type, raw] = part.split(":");

		let users: string[] = [];

		switch (type) {
			case "ROLE":
				users = await resolveRole(raw);
				break;
			case "USER":
				users = await resolveUser(raw, context);
				break;
			case "DYNAMIC":
				users = await resolveDynamic(raw, context);
				break;
			default:
				throw new Error(`Invalid MULTI resolver: ${part}`);
		}

		users.forEach((u) => results.add(u));
	}

	return Array.from(results);
}
