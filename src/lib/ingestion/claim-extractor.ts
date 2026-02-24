import { z } from "zod";
import { claimExtractionPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import { claimMetadataSchema } from "@/lib/schemas";
import type { Chunk, Claim, ClaimType, ConfidenceLevel } from "@/lib/types";
import { ClaimExtractionError } from "@/lib/utils/errors";
import { generateId } from "@/lib/utils/id";

const extractedClaimSchema = z.object({
	claims: z.array(
		z.object({
			type: z.enum(["assertion", "methodology", "finding", "citation"]),
			statement: z.string(),
			evidence: z.string(),
			confidence: z.enum(["high", "medium", "low"]),
			metadata: claimMetadataSchema.optional().default({}),
		}),
	),
});

export interface PaperContext {
	title: string;
	authors: string[];
}

export async function extractClaims(chunk: Chunk, paperContext: PaperContext): Promise<Claim[]> {
	try {
		const result = await extractStructured({
			prompt: claimExtractionPrompt(chunk.content, paperContext.title, paperContext.authors),
			schema: extractedClaimSchema,
			systemPrompt:
				"You are an expert academic researcher. Extract claims precisely from the provided text. Return valid JSON only.",
		});

		return result.claims.map((raw) => ({
			id: generateId("claim"),
			paperId: chunk.paperId,
			chunkId: chunk.id,
			type: raw.type as ClaimType,
			statement: raw.statement,
			evidence: raw.evidence,
			confidence: raw.confidence as ConfidenceLevel,
			themeIds: [],
			metadata: raw.metadata ?? {},
		}));
	} catch (error) {
		throw new ClaimExtractionError(
			`Failed to extract claims from chunk ${chunk.id}: ${error instanceof Error ? error.message : String(error)}`,
			{ chunkId: chunk.id, originalError: error },
		);
	}
}
