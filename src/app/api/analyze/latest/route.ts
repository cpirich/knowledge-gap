import { NextResponse } from "next/server";
import { getLatestAnalysis } from "@/lib/store";
import type { AnalysisResult, ApiResponse } from "@/lib/types";

export async function GET(): Promise<NextResponse<ApiResponse<AnalysisResult>>> {
	const analysis = getLatestAnalysis();
	if (!analysis) {
		return NextResponse.json(
			{
				success: false,
				error: {
					code: "NO_ANALYSIS",
					message: "No analysis available yet.",
				},
			},
			{ status: 404 },
		);
	}

	return NextResponse.json({ success: true, data: analysis });
}
