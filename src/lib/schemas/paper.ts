import { z } from "zod";

export const paperStatusSchema = z.enum([
	"uploading",
	"extracting_text",
	"chunking",
	"extracting_claims",
	"ready",
	"error",
]);

export const chunkSchema = z.object({
	id: z.string(),
	paperId: z.string(),
	content: z.string(),
	startOffset: z.number().int().min(0),
	endOffset: z.number().int().min(0),
	chunkIndex: z.number().int().min(0),
	tokenEstimate: z.number().int().min(0),
});

export const paperSchema = z.object({
	id: z.string(),
	filename: z.string(),
	title: z.string(),
	authors: z.array(z.string()),
	abstract: z.string(),
	uploadedAt: z.string(),
	sourceType: z.enum(["pdf", "text"]),
	rawText: z.string(),
	chunks: z.array(chunkSchema),
	claimIds: z.array(z.string()),
	status: paperStatusSchema,
});
