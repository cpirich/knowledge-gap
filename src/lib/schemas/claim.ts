import { z } from "zod";

export const claimTypeSchema = z.enum(["assertion", "methodology", "finding", "citation"]);
export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const claimMetadataSchema = z.object({
	pageNumber: z.number().int().optional(),
	section: z.string().optional(),
	citedSources: z.array(z.string()).optional(),
	methodology: z.string().optional(),
});

export const claimSchema = z.object({
	id: z.string(),
	paperId: z.string(),
	chunkId: z.string(),
	type: claimTypeSchema,
	statement: z.string(),
	evidence: z.string(),
	confidence: confidenceLevelSchema,
	themeIds: z.array(z.string()),
	metadata: claimMetadataSchema,
});
