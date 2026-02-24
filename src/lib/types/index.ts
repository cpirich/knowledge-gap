export type {
	AnalysisResult,
	Contradiction,
	ContradictionCategory,
	ContradictionSeverity,
	Gap,
	GapType,
	ResearchQuestion,
} from "./analysis";
export type { Claim, ClaimMetadata, ClaimType, ConfidenceLevel } from "./claim";
export type { GraphData, GraphEdge, GraphNode, GraphNodeType } from "./graph";
export type { Chunk, Paper, PaperStatus } from "./paper";
export type { Relationship, RelationshipType, Theme } from "./theme";

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: {
		code: string;
		message: string;
		details?: unknown;
	};
}
