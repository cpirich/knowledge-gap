import { z } from "zod";
import { themeClusteringPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import type { Claim, Theme } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const themeClusteringResponseSchema = z.object({
	themes: z.array(
		z.object({
			label: z.string(),
			description: z.string(),
			claimIds: z.array(z.string()),
		}),
	),
});

export async function clusterThemes(claims: Claim[]): Promise<Theme[]> {
	if (claims.length === 0) return [];

	const claimSummaries = claims.map((c) => ({
		id: c.id,
		statement: c.statement,
		type: c.type,
	}));

	const result = await extractStructured({
		prompt: themeClusteringPrompt(claimSummaries),
		schema: themeClusteringResponseSchema,
		systemPrompt:
			"You are an expert research analyst. Group academic claims into coherent research themes.",
	});

	const totalClaims = claims.length;
	const claimToPaper = new Map<string, string>();
	for (const claim of claims) {
		claimToPaper.set(claim.id, claim.paperId);
	}

	return result.themes.map((t) => {
		const validClaimIds = t.claimIds.filter((id) => claimToPaper.has(id));
		const paperIds = [...new Set(validClaimIds.map((id) => claimToPaper.get(id)!))];
		const density = totalClaims > 0 ? validClaimIds.length / totalClaims : 0;

		return {
			id: generateId("theme"),
			label: t.label,
			description: t.description,
			claimIds: validClaimIds,
			paperIds,
			density: Math.min(density, 1),
		};
	});
}
