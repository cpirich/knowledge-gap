import { z } from "zod";
import { relationshipMappingPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import { relationshipTypeSchema } from "@/lib/schemas";
import type { Claim, Relationship, Theme } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const relationshipMappingResponseSchema = z.object({
	relationships: z.array(
		z.object({
			sourceThemeId: z.string(),
			targetThemeId: z.string(),
			type: relationshipTypeSchema,
			strength: z.number().min(0).max(1),
			evidence: z.string(),
		}),
	),
});

export async function mapRelationships(themes: Theme[], _claims: Claim[]): Promise<Relationship[]> {
	if (themes.length < 2) return [];

	const themeSummaries = themes.map((t) => ({
		id: t.id,
		label: t.label,
		description: t.description,
	}));

	const result = await extractStructured({
		prompt: relationshipMappingPrompt(themeSummaries),
		schema: relationshipMappingResponseSchema,
		systemPrompt:
			"You are an expert research analyst. Identify relationships between research themes.",
	});

	const themeIds = new Set(themes.map((t) => t.id));

	return result.relationships
		.filter((r) => themeIds.has(r.sourceThemeId) && themeIds.has(r.targetThemeId))
		.map((r) => ({
			id: generateId("rel"),
			sourceThemeId: r.sourceThemeId,
			targetThemeId: r.targetThemeId,
			type: r.type,
			strength: r.strength,
			evidence: r.evidence,
		}));
}
