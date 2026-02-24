import type { Relationship, Theme } from "./theme";

export type ContradictionSeverity = "critical" | "major" | "minor";
export type ContradictionCategory =
	| "direct_conflict"
	| "methodological"
	| "scope_difference"
	| "temporal"
	| "interpretation";

export type GapType =
	| "unexplored_intersection"
	| "sparse_coverage"
	| "methodological_gap"
	| "temporal_gap"
	| "contradictory_area";

export interface Contradiction {
	id: string;
	claimAId: string;
	claimBId: string;
	paperAId: string;
	paperBId: string;
	description: string;
	severity: ContradictionSeverity;
	category: ContradictionCategory;
	resolution?: string;
}

export interface Gap {
	id: string;
	title: string;
	description: string;
	type: GapType;
	relatedThemeIds: string[];
	confidence: number;
	evidence: string;
	potentialImpact: string;
}

export interface ResearchQuestion {
	id: string;
	gapId: string;
	question: string;
	rationale: string;
	relatedThemeIds: string[];
	suggestedMethodology?: string;
	priorityScore: number;
}

export interface AnalysisResult {
	id: string;
	paperIds: string[];
	themes: Theme[];
	relationships: Relationship[];
	contradictions: Contradiction[];
	gaps: Gap[];
	questions: ResearchQuestion[];
	createdAt: string;
	status: "pending" | "running" | "complete" | "error";
}
