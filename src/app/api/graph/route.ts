import { NextResponse } from "next/server";
import { buildGraphData } from "@/lib/graph/builder";
import { getLatestAnalysis } from "@/lib/store";
import type { ApiResponse, GraphData } from "@/lib/types";

export const dynamic = "force-static";

export async function GET(): Promise<NextResponse<ApiResponse<GraphData>>> {
	try {
		const analysis = getLatestAnalysis();
		if (!analysis) {
			return NextResponse.json(
				{
					success: false,
					error: {
						code: "NO_ANALYSIS",
						message: "No analysis available. Run gap analysis first.",
					},
				},
				{ status: 404 },
			);
		}

		const graphData = buildGraphData(analysis);
		return NextResponse.json({ success: true, data: graphData });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ success: false, error: { code: "GRAPH_ERROR", message } },
			{ status: 500 },
		);
	}
}
