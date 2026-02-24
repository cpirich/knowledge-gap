// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	AnalysisResult,
	ApiResponse,
	Claim,
	Contradiction,
	Paper,
	ResearchQuestion,
} from "@/lib/types";

// Mock the AI client
vi.mock("@/lib/ai/client", () => ({
	getClient: vi.fn(() => ({
		messages: { create: vi.fn() },
	})),
}));

// Mock the structured extraction
vi.mock("@/lib/ai/structured", () => ({
	extractStructured: vi.fn(),
}));

// Shared state for store mocks
const papersMap = new Map<string, Paper>();
const claimsMap = new Map<string, Claim>();
const analysesMap = new Map<string, AnalysisResult>();

// Mock the store index (used by analyze routes)
vi.mock("@/lib/store", () => ({
	getAllPapers: vi.fn(() => [...papersMap.values()]),
	getPaper: vi.fn((id: string) => papersMap.get(id)),
	getClaimsByPaper: vi.fn((paperId: string) =>
		[...claimsMap.values()].filter((c) => c.paperId === paperId),
	),
	addClaim: vi.fn((claim: Claim) => {
		claimsMap.set(claim.id, claim);
	}),
	saveAnalysis: vi.fn((analysis: AnalysisResult) => {
		analysesMap.set(analysis.id, analysis);
	}),
	getAnalysis: vi.fn((id: string) => analysesMap.get(id)),
	getLatestAnalysis: vi.fn(() => {
		const all = [...analysesMap.values()];
		if (all.length === 0) return undefined;
		return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
	}),
}));

import { POST as postContradictions } from "@/app/api/analyze/contradictions/route";
import { POST as postGaps } from "@/app/api/analyze/gaps/route";
import { POST as postQuestions } from "@/app/api/analyze/questions/route";
import { extractStructured } from "@/lib/ai/structured";

const mockExtractStructured = vi.mocked(extractStructured);

function makePaper(id: string): Paper {
	return {
		id,
		filename: `${id}.txt`,
		title: `Paper ${id}`,
		authors: ["Author A"],
		abstract: "Abstract text",
		uploadedAt: new Date().toISOString(),
		sourceType: "text",
		rawText: "Raw text content for testing purposes.",
		chunks: [],
		claimIds: [`claim_${id}_1`, `claim_${id}_2`],
		status: "ready",
	};
}

function makeClaim(id: string, paperId: string, themeIds: string[] = []): Claim {
	return {
		id,
		paperId,
		chunkId: `chunk_${paperId}_1`,
		type: "finding",
		statement: `Finding from ${paperId}: claim ${id}`,
		evidence: `Evidence for ${id}`,
		confidence: "high",
		themeIds,
		metadata: {},
	};
}

function seedPapersAndClaims(): void {
	const paper1 = makePaper("paper_1");
	const paper2 = makePaper("paper_2");
	papersMap.set(paper1.id, paper1);
	papersMap.set(paper2.id, paper2);

	const claims = [
		makeClaim("claim_paper_1_1", "paper_1", ["theme_1"]),
		makeClaim("claim_paper_1_2", "paper_1", ["theme_1"]),
		makeClaim("claim_paper_2_1", "paper_2", ["theme_1"]),
		makeClaim("claim_paper_2_2", "paper_2", ["theme_2"]),
	];
	for (const claim of claims) {
		claimsMap.set(claim.id, claim);
	}
}

describe("/api/analyze/*", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		papersMap.clear();
		claimsMap.clear();
		analysesMap.clear();
	});

	afterEach(() => {
		papersMap.clear();
		claimsMap.clear();
		analysesMap.clear();
	});

	describe("POST /api/analyze/contradictions", () => {
		it("returns contradictions when papers are in store", async () => {
			seedPapersAndClaims();

			mockExtractStructured.mockResolvedValue({
				contradictions: [
					{
						claimAId: "claim_paper_1_1",
						claimBId: "claim_paper_2_1",
						paperAId: "paper_1",
						paperBId: "paper_2",
						description: "Opposing findings about the same topic",
						severity: "major",
						category: "direct_conflict",
						resolution: "Different experimental conditions",
					},
				],
			});

			const response = await postContradictions();
			const json = (await response.json()) as ApiResponse<Contradiction[]>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data!.length).toBeGreaterThanOrEqual(1);
			expect(json.data![0].description).toBe("Opposing findings about the same topic");
			expect(json.data![0].severity).toBe("major");
			expect(json.data![0].id).toMatch(/^contra_/);
		});

		it("returns 404 when no papers are available", async () => {
			const response = await postContradictions();
			const json = (await response.json()) as ApiResponse<Contradiction[]>;

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
			expect(json.error!.code).toBe("NO_PAPERS");
		});
	});

	describe("POST /api/analyze/gaps", () => {
		it("returns analysis result with themes, relationships, and gaps", async () => {
			seedPapersAndClaims();

			// Mock theme clustering
			let callCount = 0;
			mockExtractStructured.mockImplementation(async () => {
				callCount++;
				// First call: theme clustering
				if (callCount === 1) {
					return {
						themes: [
							{
								label: "Sleep and Memory",
								description: "Research on sleep-dependent memory consolidation",
								claimIds: ["claim_paper_1_1", "claim_paper_1_2", "claim_paper_2_1"],
							},
							{
								label: "Methodology",
								description: "Methodological approaches",
								claimIds: ["claim_paper_2_2"],
							},
						],
					};
				}
				// Second call: relationship mapping
				if (callCount === 2) {
					return {
						relationships: [
							{
								sourceThemeId: "will_be_dynamic",
								targetThemeId: "will_be_dynamic",
								type: "extends",
								strength: 0.6,
								evidence: "Methodological overlap",
							},
						],
					};
				}
				// Third call: contradiction detection
				if (callCount === 3) {
					return { contradictions: [] };
				}
				// Fourth call: gap finding
				return {
					gaps: [
						{
							title: "Napping vs Nocturnal Sleep",
							description: "Comparative efficiency is unknown",
							type: "methodological_gap",
							relatedThemeIds: [],
							confidence: 0.75,
							evidence: "Limited studies on nap-based consolidation",
							potentialImpact: "Could inform sleep interventions",
						},
					],
				};
			});

			const response = await postGaps();
			const json = (await response.json()) as ApiResponse<AnalysisResult>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data!.themes.length).toBeGreaterThanOrEqual(1);
			expect(json.data!.status).toBe("complete");
			expect(json.data!.paperIds).toContain("paper_1");
			expect(json.data!.paperIds).toContain("paper_2");
			expect(json.data!.id).toMatch(/^analysis_/);
		});

		it("returns 404 when no papers are available", async () => {
			const response = await postGaps();
			const json = (await response.json()) as ApiResponse<AnalysisResult>;

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
			expect(json.error!.code).toBe("NO_PAPERS");
		});
	});

	describe("POST /api/analyze/questions", () => {
		it("returns research questions when analysis is in store", async () => {
			// Seed an analysis with gaps
			const analysis: AnalysisResult = {
				id: "analysis_1",
				paperIds: ["paper_1"],
				themes: [
					{
						id: "theme_1",
						label: "Sleep and Memory",
						description: "Sleep-dependent consolidation",
						claimIds: ["claim_1"],
						paperIds: ["paper_1"],
						density: 0.6,
					},
				],
				relationships: [],
				contradictions: [],
				gaps: [
					{
						id: "gap_1",
						title: "Napping Efficiency",
						description: "Unknown comparative efficiency",
						type: "methodological_gap",
						relatedThemeIds: ["theme_1"],
						confidence: 0.8,
						evidence: "Limited studies",
						potentialImpact: "Practical recommendations",
					},
				],
				questions: [],
				createdAt: new Date().toISOString(),
				status: "complete",
			};
			analysesMap.set(analysis.id, analysis);

			mockExtractStructured.mockResolvedValue({
				questions: [
					{
						gapId: "gap_1",
						question: "What is the minimum nap duration for consolidation?",
						rationale: "Dose-response relationship is unclear",
						relatedThemeIds: ["theme_1"],
						suggestedMethodology: "Polysomnography study",
						priorityScore: 0.85,
					},
					{
						gapId: "gap_1",
						question: "Do emotional memories consolidate differently during naps?",
						rationale: "REM is less common in short naps",
						relatedThemeIds: ["theme_1"],
						priorityScore: 0.72,
					},
				],
			});

			const response = await postQuestions();
			const json = (await response.json()) as ApiResponse<ResearchQuestion[]>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data!.length).toBe(2);
			expect(json.data![0].question).toContain("minimum nap duration");
			expect(json.data![0].id).toMatch(/^question_/);
			expect(json.data![0].gapId).toBe("gap_1");
			expect(json.data![0].priorityScore).toBe(0.85);
		});

		it("returns 404 when no analysis is available", async () => {
			const response = await postQuestions();
			const json = (await response.json()) as ApiResponse<ResearchQuestion[]>;

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
			expect(json.error!.code).toBe("NO_ANALYSIS");
		});

		it("returns empty array when analysis has no gaps", async () => {
			const analysis: AnalysisResult = {
				id: "analysis_no_gaps",
				paperIds: ["paper_1"],
				themes: [],
				relationships: [],
				contradictions: [],
				gaps: [],
				questions: [],
				createdAt: new Date().toISOString(),
				status: "complete",
			};
			analysesMap.set(analysis.id, analysis);

			const response = await postQuestions();
			const json = (await response.json()) as ApiResponse<ResearchQuestion[]>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toEqual([]);
		});
	});
});
