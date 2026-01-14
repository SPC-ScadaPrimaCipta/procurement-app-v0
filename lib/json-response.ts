import { NextResponse } from "next/server";

/**
 * Custom JSON serializer that handles BigInt conversion
 * Converts BigInt values to strings to avoid JSON serialization errors
 */
export function serializeBigInt(data: any): any {
	if (data === null || data === undefined) {
		return data;
	}

	if (typeof data === "bigint") {
		return data.toString();
	}

	if (Array.isArray(data)) {
		return data.map((item) => serializeBigInt(item));
	}

	if (typeof data === "object") {
		const serialized: any = {};
		for (const key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				serialized[key] = serializeBigInt(data[key]);
			}
		}
		return serialized;
	}

	return data;
}

/**
 * Custom NextResponse.json wrapper that automatically handles BigInt serialization
 */
export function jsonResponse(data: any, init?: ResponseInit) {
	const serializedData = serializeBigInt(data);
	return NextResponse.json(serializedData, init);
}
