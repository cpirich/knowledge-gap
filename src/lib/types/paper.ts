export type PaperStatus =
	| "uploading"
	| "extracting_text"
	| "chunking"
	| "extracting_claims"
	| "ready"
	| "error";

export interface Chunk {
	id: string;
	paperId: string;
	content: string;
	startOffset: number;
	endOffset: number;
	chunkIndex: number;
	tokenEstimate: number;
}

export interface Paper {
	id: string;
	filename: string;
	title: string;
	authors: string[];
	abstract: string;
	uploadedAt: string;
	sourceType: "pdf" | "text";
	rawText: string;
	chunks: Chunk[];
	claimIds: string[];
	status: PaperStatus;
}
