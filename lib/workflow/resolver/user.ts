export async function resolveUser(
	value: string,
	context: any
): Promise<string[]> {
	if (value === "SUBMITTER") {
		return [context.submitterId];
	}

	// value = userId
	return [value];
}
