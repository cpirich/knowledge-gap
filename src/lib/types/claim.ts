export type ClaimType = "assertion" | "methodology" | "finding" | "citation";
export type ConfidenceLevel = "high" | "medium" | "low";

export interface ClaimMetadata {
	pageNumber?: number;
	section?: string;
	citedSources?: string[];
	methodology?: string;
}

export interface Claim {
	id: string;
	paperId: string;
	chunkId: string;
	type: ClaimType;
	statement: string;
	evidence: string;
	confidence: ConfidenceLevel;
	themeIds: string[];
	metadata: ClaimMetadata;
}
