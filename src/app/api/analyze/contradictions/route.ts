import { NextResponse } from "next/server";
import { detectContradictions } from "@/lib/analysis/contradiction-detector";
import { getAllPapers, getClaimsByPaper } from "@/lib/store";
import type { ApiResponse, Contradiction } from "@/lib/types";

export const dynamic = "force-static";

export async function POST(): Promise<NextResponse<ApiResponse<Contradiction[]>>> {
	try {
		const papers = getAllPapers().filter((p) => p.status === "ready");
		if (papers.length === 0) {
			return NextResponse.json(
				{ success: false, error: { code: "NO_PAPERS", message: "No papers available" } },
				{ status: 404 },
			);
		}

		const claims = papers.flatMap((p) => getClaimsByPaper(p.id));
		if (claims.length < 2) {
			return NextResponse.json({ success: true, data: [] });
		}

		const contradictions = await detectContradictions(claims, papers);
		return NextResponse.json({ success: true, data: contradictions });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ success: false, error: { code: "ANALYSIS_ERROR", message } },
			{ status: 500 },
		);
	}
}
