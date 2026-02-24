import { z } from "zod";
import { contradictionDetectionPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import { contradictionCategorySchema, contradictionSeveritySchema } from "@/lib/schemas";
import type { Claim, Contradiction, Paper } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const contradictionResponseSchema = z.object({
	contradictions: z.array(
		z.object({
			claimAId: z.string(),
			claimBId: z.string(),
			paperAId: z.string(),
			paperBId: z.string(),
			description: z.string(),
			severity: contradictionSeveritySchema,
			category: contradictionCategorySchema,
			resolution: z.string().optional(),
		}),
	),
});

interface ClaimPair {
	claimA: { id: string; paperId: string; statement: string; evidence: string };
	claimB: { id: string; paperId: string; statement: string; evidence: string };
}

function buildCandidatePairs(claims: Claim[], _papers: Paper[]): ClaimPair[] {
	const pairs: ClaimPair[] = [];

	// Group claims by overlapping themes
	const themeToClaimIds = new Map<string, string[]>();
	for (const claim of claims) {
		for (const themeId of claim.themeIds) {
			const existing = themeToClaimIds.get(themeId) ?? [];
			existing.push(claim.id);
			themeToClaimIds.set(themeId, existing);
		}
	}

	const claimMap = new Map(claims.map((c) => [c.id, c]));
	const seen = new Set<string>();

	// Pair claims that share themes but come from different papers
	for (const claimIds of themeToClaimIds.values()) {
		for (let i = 0; i < claimIds.length; i++) {
			for (let j = i + 1; j < claimIds.length; j++) {
				const a = claimMap.get(claimIds[i])!;
				const b = claimMap.get(claimIds[j])!;

				if (a.paperId === b.paperId) continue;

				const pairKey = [a.id, b.id].sort().join(":");
				if (seen.has(pairKey)) continue;
				seen.add(pairKey);

				pairs.push({
					claimA: { id: a.id, paperId: a.paperId, statement: a.statement, evidence: a.evidence },
					claimB: { id: b.id, paperId: b.paperId, statement: b.statement, evidence: b.evidence },
				});
			}
		}
	}

	// If no theme-based pairs (claims may lack themeIds), compare across papers
	if (pairs.length === 0 && claims.length > 1) {
		for (let i = 0; i < claims.length; i++) {
			for (let j = i + 1; j < claims.length; j++) {
				const a = claims[i];
				const b = claims[j];
				if (a.paperId === b.paperId) continue;

				const pairKey = [a.id, b.id].sort().join(":");
				if (seen.has(pairKey)) continue;
				seen.add(pairKey);

				pairs.push({
					claimA: { id: a.id, paperId: a.paperId, statement: a.statement, evidence: a.evidence },
					claimB: { id: b.id, paperId: b.paperId, statement: b.statement, evidence: b.evidence },
				});
			}
		}
	}

	return pairs;
}

const BATCH_SIZE = 5;

export async function detectContradictions(
	claims: Claim[],
	papers: Paper[],
): Promise<Contradiction[]> {
	if (claims.length < 2) return [];

	const candidatePairs = buildCandidatePairs(claims, papers);
	if (candidatePairs.length === 0) return [];

	const contradictions: Contradiction[] = [];

	// Process in batches of BATCH_SIZE
	for (let i = 0; i < candidatePairs.length; i += BATCH_SIZE) {
		const batch = candidatePairs.slice(i, i + BATCH_SIZE);

		const result = await extractStructured({
			prompt: contradictionDetectionPrompt(batch),
			schema: contradictionResponseSchema,
			systemPrompt:
				"You are an expert research analyst. Identify genuine contradictions between academic claims. Be conservative — only flag real contradictions.",
		});

		for (const c of result.contradictions) {
			contradictions.push({
				id: generateId("contra"),
				claimAId: c.claimAId,
				claimBId: c.claimBId,
				paperAId: c.paperAId,
				paperBId: c.paperBId,
				description: c.description,
				severity: c.severity,
				category: c.category,
				resolution: c.resolution,
			});
		}
	}

	return contradictions;
}
