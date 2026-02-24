// @vitest-environment node
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	AnalysisResult,
	ApiResponse,
	Claim,
	Contradiction,
	GraphData,
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

// Mock the claim extractor
vi.mock("@/lib/ingestion/claim-extractor", () => ({
	extractClaims: vi.fn(),
}));

// Mock pdf-parse
vi.mock("pdf-parse", () => {
	class MockPDFParse {
		async getText() {
			return {
				text: "Sample extracted PDF text.\n\nThis is the second paragraph.",
				total: 1,
				pages: [],
			};
		}
		async destroy() {}
	}
	return { PDFParse: MockPDFParse };
});

// Shared state for stores
const papersMap = new Map<string, Paper>();
const claimsMap = new Map<string, Claim>();
const analysesMap = new Map<string, AnalysisResult>();

// Mock paper-store (used by ingestion pipeline and papers route)
vi.mock("@/lib/store/paper-store", () => ({
	addPaper: vi.fn((paper: Paper) => {
		papersMap.set(paper.id, paper);
	}),
	updatePaper: vi.fn((id: string, updates: Partial<Paper>) => {
		const existing = papersMap.get(id);
		if (!existing) throw new Error(`Paper not found: ${id}`);
		const updated = { ...existing, ...updates };
		papersMap.set(id, updated);
		return updated;
	}),
	getPaper: vi.fn((id: string) => papersMap.get(id)),
	getAllPapers: vi.fn(() => [...papersMap.values()]),
	deletePaper: vi.fn((id: string) => papersMap.delete(id)),
	addClaim: vi.fn((claim: Claim) => {
		claimsMap.set(claim.id, claim);
	}),
	getClaim: vi.fn((id: string) => claimsMap.get(id)),
	getClaimsByPaper: vi.fn((paperId: string) =>
		[...claimsMap.values()].filter((c) => c.paperId === paperId),
	),
}));

// Mock the store barrel export (used by analyze routes and graph route)
vi.mock("@/lib/store", () => ({
	getAllPapers: vi.fn(() => [...papersMap.values()]),
	getPaper: vi.fn((id: string) => papersMap.get(id)),
	addPaper: vi.fn((paper: Paper) => {
		papersMap.set(paper.id, paper);
	}),
	updatePaper: vi.fn((id: string, updates: Partial<Paper>) => {
		const existing = papersMap.get(id);
		if (!existing) throw new Error(`Paper not found: ${id}`);
		const updated = { ...existing, ...updates };
		papersMap.set(id, updated);
		return updated;
	}),
	deletePaper: vi.fn((id: string) => papersMap.delete(id)),
	addClaim: vi.fn((claim: Claim) => {
		claimsMap.set(claim.id, claim);
	}),
	getClaim: vi.fn((id: string) => claimsMap.get(id)),
	getClaimsByPaper: vi.fn((paperId: string) =>
		[...claimsMap.values()].filter((c) => c.paperId === paperId),
	),
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

import { POST as contradictionsPost } from "@/app/api/analyze/contradictions/route";
import { POST as gapsPost } from "@/app/api/analyze/gaps/route";
import { POST as questionsPost } from "@/app/api/analyze/questions/route";
import { GET as graphGet } from "@/app/api/graph/route";
import { POST as ingestPost } from "@/app/api/ingest/route";
import { GET as papersGet } from "@/app/api/papers/route";
import { extractStructured } from "@/lib/ai/structured";
import { extractClaims } from "@/lib/ingestion/claim-extractor";

const mockExtractStructured = vi.mocked(extractStructured);
const mockExtractClaims = vi.mocked(extractClaims);

function createFileRequest(filename: string, content: string): Request {
	const blob = new Blob([content], { type: "text/plain" });
	const file = new File([blob], filename, { type: "text/plain" });
	const formData = new FormData();
	formData.set("file", file);
	return new Request("http://localhost:3000/api/ingest", {
		method: "POST",
		body: formData,
	});
}

describe("End-to-end pipeline", () => {
	// Store paperId and claim IDs that we will use throughout the flow
	let ingestedPaperId: string;
	let claimIds: string[];

	beforeEach(() => {
		vi.clearAllMocks();
		papersMap.clear();
		claimsMap.clear();
		analysesMap.clear();

		claimIds = [];
	});

	afterEach(() => {
		papersMap.clear();
		claimsMap.clear();
		analysesMap.clear();
	});

	it("full flow: upload -> ingest -> papers -> analyze gaps -> contradictions -> questions -> graph", async () => {
		// ========================================
		// STEP 1: Ingest a text file
		// ========================================
		const sampleText = fs.readFileSync(
			path.join(process.cwd(), "tests/fixtures/sample-text.txt"),
			"utf-8",
		);

		// Mock metadata extraction
		mockExtractStructured.mockResolvedValueOnce({
			title: "Sleep-Dependent Memory Consolidation",
			authors: ["Sarah J. Chen", "Michael R. Torres", "Anika Patel"],
			abstract: "Memory consolidation during sleep represents a critical process.",
		});

		// Mock claim extraction to return realistic claims
		mockExtractClaims.mockImplementation(async (chunk) => {
			const id1 = `claim_${chunk.chunkIndex}_a`;
			const id2 = `claim_${chunk.chunkIndex}_b`;
			claimIds.push(id1, id2);
			return [
				{
					id: id1,
					paperId: chunk.paperId,
					chunkId: chunk.id,
					type: "finding",
					statement: `Finding from chunk ${chunk.chunkIndex}: SWS deprivation impairs memory`,
					evidence: "Meta-analysis evidence",
					confidence: "high",
					themeIds: [],
					metadata: { section: "Results" },
				},
				{
					id: id2,
					paperId: chunk.paperId,
					chunkId: chunk.id,
					type: "assertion",
					statement: `Assertion from chunk ${chunk.chunkIndex}: Dual-process model is oversimplified`,
					evidence: "Cross-stage interactions observed",
					confidence: "medium",
					themeIds: [],
					metadata: { section: "Discussion" },
				},
			];
		});

		const ingestResponse = await ingestPost(createFileRequest("sleep-memory.txt", sampleText));
		const ingestJson = (await ingestResponse.json()) as ApiResponse<Paper>;

		expect(ingestResponse.status).toBe(200);
		expect(ingestJson.success).toBe(true);
		expect(ingestJson.data!.status).toBe("ready");
		expect(ingestJson.data!.title).toBe("Sleep-Dependent Memory Consolidation");
		expect(ingestJson.data!.chunks.length).toBeGreaterThan(0);
		expect(ingestJson.data!.claimIds.length).toBeGreaterThan(0);

		ingestedPaperId = ingestJson.data!.id;

		// ========================================
		// STEP 2: Verify paper appears in papers list
		// ========================================
		const papersResponse = await papersGet();
		const papersJson = (await papersResponse.json()) as ApiResponse<Paper[]>;

		expect(papersResponse.status).toBe(200);
		expect(papersJson.data!).toHaveLength(1);
		expect(papersJson.data![0].id).toBe(ingestedPaperId);
		expect(papersJson.data![0].status).toBe("ready");

		// ========================================
		// STEP 3: Run gap analysis (themes + relationships + gaps)
		// ========================================
		// Reset the mock for analysis calls (metadata extraction was used above)
		mockExtractStructured.mockReset();

		let analysisCallCount = 0;
		const actualClaimIds = [...claimsMap.keys()];

		mockExtractStructured.mockImplementation(async () => {
			analysisCallCount++;

			// First call: theme clustering
			if (analysisCallCount === 1) {
				return {
					themes: [
						{
							label: "SWS and Declarative Memory",
							description: "Slow-wave sleep effects on declarative memory",
							claimIds: actualClaimIds.slice(0, Math.ceil(actualClaimIds.length / 2)),
						},
						{
							label: "Sleep Stage Interactions",
							description: "Cross-stage interactions in memory consolidation",
							claimIds: actualClaimIds.slice(Math.ceil(actualClaimIds.length / 2)),
						},
					],
				};
			}

			// Second call: relationship mapping
			// Note: contradiction detection is skipped because all claims are from a single
			// paper, so detectContradictions returns [] without calling extractStructured.
			if (analysisCallCount === 2) {
				return {
					relationships: [],
				};
			}

			// Third call: gap finding (not fourth, since contradiction detection was skipped)
			return {
				gaps: [
					{
						title: "Napping vs Nocturnal Sleep",
						description: "Comparative efficiency of napping is poorly understood",
						type: "methodological_gap",
						relatedThemeIds: [],
						confidence: 0.8,
						evidence: "Limited comparative studies exist",
						potentialImpact: "Could guide practical sleep interventions",
					},
				],
			};
		});

		const gapsResponse = await gapsPost();
		const gapsJson = (await gapsResponse.json()) as ApiResponse<AnalysisResult>;

		expect(gapsResponse.status).toBe(200);
		expect(gapsJson.success).toBe(true);
		expect(gapsJson.data!.status).toBe("complete");
		expect(gapsJson.data!.themes.length).toBe(2);
		expect(gapsJson.data!.themes[0].label).toBe("SWS and Declarative Memory");
		expect(gapsJson.data!.paperIds).toContain(ingestedPaperId);

		const analysisId = gapsJson.data!.id;

		// ========================================
		// STEP 4: Run contradiction detection
		// ========================================
		mockExtractStructured.mockReset();
		mockExtractStructured.mockResolvedValue({
			contradictions: [
				{
					claimAId: actualClaimIds[0],
					claimBId: actualClaimIds[1],
					paperAId: ingestedPaperId,
					paperBId: ingestedPaperId,
					description: "Internal tension between SWS specificity and cross-stage model",
					severity: "minor",
					category: "interpretation",
				},
			],
		});

		// Contradiction detection requires cross-paper claims; with single paper
		// the detector may skip. We verify the API itself works.
		const contradictionsResponse = await contradictionsPost();
		const contradictionsJson = (await contradictionsResponse.json()) as ApiResponse<
			Contradiction[]
		>;

		expect(contradictionsResponse.status).toBe(200);
		expect(contradictionsJson.success).toBe(true);
		// With a single paper, contradictions may be empty (claims from same paper are skipped)
		expect(contradictionsJson.data).toBeDefined();

		// ========================================
		// STEP 5: Generate research questions
		// ========================================
		mockExtractStructured.mockReset();
		const analysisFromStore = analysesMap.get(analysisId);
		const gapId = analysisFromStore?.gaps[0]?.id;

		if (gapId) {
			const themeId1 = analysisFromStore!.themes[0]?.id;

			mockExtractStructured.mockResolvedValue({
				questions: [
					{
						gapId: gapId,
						question:
							"What is the minimum nap duration for effective declarative memory consolidation?",
						rationale:
							"Dose-response relationship between nap duration and consolidation is undefined.",
						relatedThemeIds: themeId1 ? [themeId1] : [],
						suggestedMethodology: "Within-subjects polysomnography with paired-associates tasks",
						priorityScore: 0.85,
					},
					{
						gapId: gapId,
						question:
							"How do emotional memories consolidate during naps compared to nocturnal sleep?",
						rationale: "Naps have less REM, which may disadvantage emotional memory consolidation.",
						relatedThemeIds: themeId1 ? [themeId1] : [],
						priorityScore: 0.72,
					},
				],
			});
		}

		const questionsResponse = await questionsPost();
		const questionsJson = (await questionsResponse.json()) as ApiResponse<ResearchQuestion[]>;

		expect(questionsResponse.status).toBe(200);
		expect(questionsJson.success).toBe(true);
		expect(questionsJson.data).toBeDefined();

		if (gapId) {
			expect(questionsJson.data!.length).toBe(2);
			expect(questionsJson.data![0].question).toContain("minimum nap duration");
			expect(questionsJson.data![0].id).toMatch(/^question_/);
		}

		// ========================================
		// STEP 6: Get graph data
		// ========================================
		const graphResponse = await graphGet();
		const graphJson = (await graphResponse.json()) as ApiResponse<GraphData>;

		expect(graphResponse.status).toBe(200);
		expect(graphJson.success).toBe(true);
		expect(graphJson.data).toBeDefined();
		expect(graphJson.data!.nodes).toBeDefined();
		expect(graphJson.data!.edges).toBeDefined();

		// Should have theme nodes + gap nodes
		const themeNodes = graphJson.data!.nodes.filter((n) => n.data.type === "theme");
		const gapNodes = graphJson.data!.nodes.filter((n) => n.data.type === "gap");

		expect(themeNodes.length).toBe(2);
		expect(themeNodes[0].data.label).toBe("SWS and Declarative Memory");
		expect(themeNodes[0].data.density).toBeDefined();
		expect(themeNodes[0].data.size).toBeGreaterThan(0);

		// Gap nodes should exist if gaps were found
		if (analysisFromStore?.gaps && analysisFromStore.gaps.length > 0) {
			expect(gapNodes.length).toBeGreaterThan(0);
			expect(gapNodes[0].data.color).toBe("#ef4444");
			expect(gapNodes[0].data.isGap).toBe(true);
		}

		// ========================================
		// VERIFY: Data flows correctly through the pipeline
		// ========================================
		// The paper ID from ingestion should appear in the analysis
		const finalAnalysis = analysesMap.get(analysisId);
		expect(finalAnalysis).toBeDefined();
		expect(finalAnalysis!.paperIds).toContain(ingestedPaperId);

		// Questions should reference the gaps
		if (finalAnalysis!.questions.length > 0 && finalAnalysis!.gaps.length > 0) {
			const questionGapIds = finalAnalysis!.questions.map((q) => q.gapId);
			const gapIdsInAnalysis = finalAnalysis!.gaps.map((g) => g.id);
			for (const qGapId of questionGapIds) {
				expect(gapIdsInAnalysis).toContain(qGapId);
			}
		}
	});
});
