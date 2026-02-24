import { z } from "zod";

export const relationshipTypeSchema = z.enum([
	"supports",
	"contradicts",
	"extends",
	"prerequisite",
	"parallel",
	"methodology_shared",
]);

export const themeSchema = z.object({
	id: z.string(),
	label: z.string(),
	description: z.string(),
	claimIds: z.array(z.string()),
	paperIds: z.array(z.string()),
	density: z.number().min(0).max(1),
	parentThemeId: z.string().optional(),
});

export const relationshipSchema = z.object({
	id: z.string(),
	sourceThemeId: z.string(),
	targetThemeId: z.string(),
	type: relationshipTypeSchema,
	strength: z.number().min(0).max(1),
	evidence: z.string(),
});
