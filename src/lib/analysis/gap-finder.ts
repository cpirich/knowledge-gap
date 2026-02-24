import { z } from "zod";
import { gapAnalysisPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import { gapTypeSchema } from "@/lib/schemas";
import type { Contradiction, Gap, Relationship, Theme } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const gapResponseSchema = z.object({
	gaps: z.array(
		z.object({
			title: z.string(),
			description: z.string(),
			type: gapTypeSchema,
			relatedThemeIds: z.array(z.string()),
			confidence: z.number().min(0).max(1),
			evidence: z.string(),
			potentialImpact: z.string(),
		}),
	),
});

function findUnexploredIntersections(themes: Theme[], relationships: Relationship[]): string[] {
	const connected = new Set<string>();
	for (const r of relationships) {
		const key = [r.sourceThemeId, r.targetThemeId].sort().join(":");
		connected.add(key);
	}

	const areas: string[] = [];
	for (let i = 0; i < themes.length; i++) {
		for (let j = i + 1; j < themes.length; j++) {
			const key = [themes[i].id, themes[j].id].sort().join(":");
			if (!connected.has(key)) {
				areas.push(
					`Unexplored intersection: "${themes[i].label}" and "${themes[j].label}" have no identified relationship`,
				);
			}
		}
	}
	return areas;
}

function findSparseCoverage(themes: Theme[]): string[] {
	return themes
		.filter((t) => t.density < 0.2)
		.map((t) => `Sparse coverage: "${t.label}" has low density (${t.density.toFixed(2)})`);
}

function findContradictoryAreas(contradictions: Contradiction[]): string[] {
	if (contradictions.length === 0) return [];
	return contradictions.map(
		(c) => `Contradictory area: ${c.description} (severity: ${c.severity})`,
	);
}

export async function findGaps(
	themes: Theme[],
	relationships: Relationship[],
	contradictions: Contradiction[],
): Promise<Gap[]> {
	if (themes.length === 0) return [];

	const contradictionAreas = [
		...findUnexploredIntersections(themes, relationships),
		...findSparseCoverage(themes),
		...findContradictoryAreas(contradictions),
	];

	const themeSummaries = themes.map((t) => ({
		id: t.id,
		label: t.label,
		description: t.description,
		density: t.density,
	}));

	const relSummaries = relationships.map((r) => ({
		sourceThemeId: r.sourceThemeId,
		targetThemeId: r.targetThemeId,
		type: r.type,
	}));

	const result = await extractStructured({
		prompt: gapAnalysisPrompt(themeSummaries, relSummaries, contradictionAreas),
		schema: gapResponseSchema,
		systemPrompt:
			"You are an expert research analyst. Identify genuine knowledge gaps in the research landscape. Focus on actionable, impactful gaps.",
	});

	const themeIds = new Set(themes.map((t) => t.id));

	return result.gaps.map((g) => ({
		id: generateId("gap"),
		title: g.title,
		description: g.description,
		type: g.type,
		relatedThemeIds: g.relatedThemeIds.filter((id) => themeIds.has(id)),
		confidence: g.confidence,
		evidence: g.evidence,
		potentialImpact: g.potentialImpact,
	}));
}
