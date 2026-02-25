import { NextResponse } from "next/server";
import { generateQuestions } from "@/lib/analysis/question-generator";
import { getLatestAnalysis, saveAnalysis } from "@/lib/store";
import type { ApiResponse, ResearchQuestion } from "@/lib/types";

export const dynamic = "force-static";

export async function POST(): Promise<NextResponse<ApiResponse<ResearchQuestion[]>>> {
	try {
		const analysis = getLatestAnalysis();
		if (!analysis) {
			return NextResponse.json(
				{
					success: false,
					error: { code: "NO_ANALYSIS", message: "No analysis available. Run gap analysis first." },
				},
				{ status: 404 },
			);
		}

		if (analysis.gaps.length === 0) {
			return NextResponse.json({ success: true, data: [] });
		}

		const questions = await generateQuestions(analysis.gaps, analysis.themes);

		analysis.questions = questions;
		saveAnalysis(analysis);

		return NextResponse.json({ success: true, data: questions });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return NextResponse.json(
			{ success: false, error: { code: "ANALYSIS_ERROR", message } },
			{ status: 500 },
		);
	}
}
