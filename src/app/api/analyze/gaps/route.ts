import { NextResponse } from "next/server";
import { detectContradictions } from "@/lib/analysis/contradiction-detector";
import { findGaps } from "@/lib/analysis/gap-finder";
import { mapRelationships } from "@/lib/analysis/relationship-mapper";
import { clusterThemes } from "@/lib/analysis/theme-clusterer";
import { getAllPapers, getClaimsByPaper, saveAnalysis } from "@/lib/store";
import type { AnalysisResult, ApiResponse } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

export const dynamic = "force-static";

export async function POST(): Promise<NextResponse<ApiResponse<AnalysisResult>>> {
	try {
		const papers = getAllPapers().filter((p) => p.status === "ready");
		if (papers.length === 0) {
			return NextResponse.json(
				{ success: false, error: { code: "NO_PAPERS", message: "No papers available" } },
				{ status: 404 },
			);
		}

		const claims = papers.flatMap((p) => getClaimsByPaper(p.id));
		if (claims.length === 0) {
			return NextResponse.json(
				{ success: false, error: { code: "NO_CLAIMS", message: "No claims extracted" } },
				{ status: 404 },
			);
		}

		const analysisId = generateId("analysis");
		const analysis: AnalysisResult = {
			id: analysisId,
			paperIds: papers.map((p) => p.id),
			themes: [],
			relationships: [],
			contradictions: [],
			gaps: [],
			questions: [],
			createdAt: new Date().toISOString(),
			status: "running",
		};
		saveAnalysis(analysis);

		// Run theme clustering
		const themes = await clusterThemes(claims);
		analysis.themes = themes;

		// Run relationship mapping and contradiction detection in parallel
		const [relationships, contradictions] = await Promise.all([
			mapRelationships(themes, claims),
			detectContradictions(claims, papers),
		]);
		analysis.relationships = relationships;
		analysis.contradictions = contradictions;

		// Find gaps
		const gaps = await findGaps(themes, relationships, contradictions);
		analysis.gaps = gaps;

		analysis.status = "complete";
		saveAnalysis(analysis);

		return NextResponse.json({ success: true, data: analysis });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ success: false, error: { code: "ANALYSIS_ERROR", message } },
			{ status: 500 },
		);
	}
}
