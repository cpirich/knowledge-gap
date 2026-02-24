import { z } from "zod";
import { questionGenerationPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import type { Gap, ResearchQuestion, Theme } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const questionResponseSchema = z.object({
	questions: z.array(
		z.object({
			gapId: z.string(),
			question: z.string(),
			rationale: z.string(),
			relatedThemeIds: z.array(z.string()),
			suggestedMethodology: z.string().optional(),
			priorityScore: z.number().min(0).max(1),
		}),
	),
});

export async function generateQuestions(gaps: Gap[], themes: Theme[]): Promise<ResearchQuestion[]> {
	if (gaps.length === 0) return [];

	const gapSummaries = gaps.map((g) => ({
		id: g.id,
		title: g.title,
		description: g.description,
		type: g.type,
		potentialImpact: g.potentialImpact,
	}));

	const themeSummaries = themes.map((t) => ({
		id: t.id,
		label: t.label,
	}));

	const result = await extractStructured({
		prompt: questionGenerationPrompt(gapSummaries, themeSummaries),
		schema: questionResponseSchema,
		systemPrompt:
			"You are an expert research strategist. Generate specific, actionable research questions that address knowledge gaps.",
	});

	const gapIds = new Set(gaps.map((g) => g.id));
	const themeIds = new Set(themes.map((t) => t.id));

	return result.questions
		.filter((q) => gapIds.has(q.gapId))
		.map((q) => ({
			id: generateId("question"),
			gapId: q.gapId,
			question: q.question,
			rationale: q.rationale,
			relatedThemeIds: q.relatedThemeIds.filter((id) => themeIds.has(id)),
			suggestedMethodology: q.suggestedMethodology,
			priorityScore: q.priorityScore,
		}));
}
