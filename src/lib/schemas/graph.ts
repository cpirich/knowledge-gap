import { z } from "zod";

export const graphNodeSchema = z.object({
	data: z.object({
		id: z.string(),
		label: z.string(),
		type: z.enum(["theme", "paper", "gap"]),
		size: z.number(),
		color: z.string(),
		density: z.number().optional(),
		claimCount: z.number().optional(),
		isGap: z.boolean().optional(),
	}),
});

export const graphEdgeSchema = z.object({
	data: z.object({
		id: z.string(),
		source: z.string(),
		target: z.string(),
		label: z.string(),
		type: z.string(),
		strength: z.number(),
		color: z.string(),
	}),
});

export const graphDataSchema = z.object({
	nodes: z.array(graphNodeSchema),
	edges: z.array(graphEdgeSchema),
});
