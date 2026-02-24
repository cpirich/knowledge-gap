import { z } from "zod";
import { relationshipSchema, themeSchema } from "./theme";

export const contradictionSeveritySchema = z.enum(["critical", "major", "minor"]);
export const contradictionCategorySchema = z.enum([
	"direct_conflict",
	"methodological",
	"scope_difference",
	"temporal",
	"interpretation",
]);

export const gapTypeSchema = z.enum([
	"unexplored_intersection",
	"sparse_coverage",
	"methodological_gap",
	"temporal_gap",
	"contradictory_area",
]);

export const contradictionSchema = z.object({
	id: z.string(),
	claimAId: z.string(),
	claimBId: z.string(),
	paperAId: z.string(),
	paperBId: z.string(),
	description: z.string(),
	severity: contradictionSeveritySchema,
	category: contradictionCategorySchema,
	resolution: z.string().optional(),
});

export const gapSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	type: gapTypeSchema,
	relatedThemeIds: z.array(z.string()),
	confidence: z.number().min(0).max(1),
	evidence: z.string(),
	potentialImpact: z.string(),
});

export const researchQuestionSchema = z.object({
	id: z.string(),
	gapId: z.string(),
	question: z.string(),
	rationale: z.string(),
	relatedThemeIds: z.array(z.string()),
	suggestedMethodology: z.string().optional(),
	priorityScore: z.number().min(0).max(1),
});

export const analysisResultSchema = z.object({
	id: z.string(),
	paperIds: z.array(z.string()),
	themes: z.array(themeSchema),
	relationships: z.array(relationshipSchema),
	contradictions: z.array(contradictionSchema),
	gaps: z.array(gapSchema),
	questions: z.array(researchQuestionSchema),
	createdAt: z.string(),
	status: z.enum(["pending", "running", "complete", "error"]),
});
