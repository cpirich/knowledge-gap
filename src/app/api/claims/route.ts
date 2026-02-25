import { NextResponse } from "next/server";
import { getAllClaims } from "@/lib/store";
import type { ApiResponse, Claim } from "@/lib/types";

export async function GET(): Promise<NextResponse<ApiResponse<Claim[]>>> {
	const claims = getAllClaims();
	return NextResponse.json({ success: true, data: claims });
}
