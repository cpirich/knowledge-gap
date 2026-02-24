import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Claim, Paper } from "@/lib/types";

vi.mock("@/lib/ai/client", () => ({
	getClient: vi.fn(() => ({
		messages: { create: vi.fn() },
	})),
}));

vi.mock("@/lib/ai/structured", () => ({
	extractStructured: vi.fn(),
}));

import { extractStructured } from "@/lib/ai/structured";
import { detectContradictions } from "@/lib/analysis/contradiction-detector";

const mockExtractStructured = vi.mocked(extractStructured);

const makePaper = (id: string): Paper => ({
	id,
	filename: `${id}.pdf`,
	title: `Paper ${id}`,
	authors: ["Author"],
	abstract: "Abstract",
	uploadedAt: new Date().toISOString(),
	sourceType: "pdf",
	rawText: "text",
	chunks: [],
	claimIds: [],
	status: "ready",
});

const makeClaim = (overrides: Partial<Claim> = {}): Claim => ({
	id: `claim_${Math.random().toString(36).slice(2, 8)}`,
	paperId: "paper_1",
	chunkId: "chunk_1",
	type: "finding",
	statement: "Test statement",
	evidence: "Test evidence",
	confidence: "high",
	themeIds: [],
	metadata: {},
	...overrides,
});

describe("detectContradictions", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty array for fewer than 2 claims", async () => {
		const result = await detectContradictions([makeClaim()], [makePaper("paper_1")]);
		expect(result).toEqual([]);
		expect(mockExtractStructured).not.toHaveBeenCalled();
	});

	it("detects contradictions between claims from different papers", async () => {
		const claims = [
			makeClaim({
				id: "claim_1",
				paperId: "paper_1",
				statement: "X increases Y",
				evidence: "Study shows...",
				themeIds: ["theme_1"],
			}),
			makeClaim({
				id: "claim_2",
				paperId: "paper_2",
				statement: "X decreases Y",
				evidence: "Research indicates...",
				themeIds: ["theme_1"],
			}),
		];

		mockExtractStructured.mockResolvedValue({
			contradictions: [
				{
					claimAId: "claim_1",
					claimBId: "claim_2",
					paperAId: "paper_1",
					paperBId: "paper_2",
					description: "Opposing effects of X on Y",
					severity: "major",
					category: "direct_conflict",
					resolution: "May depend on conditions",
				},
			],
		});

		const contradictions = await detectContradictions(claims, [
			makePaper("paper_1"),
			makePaper("paper_2"),
		]);

		expect(contradictions).toHaveLength(1);
		expect(contradictions[0].id).toMatch(/^contra_/);
		expect(contradictions[0].description).toBe("Opposing effects of X on Y");
		expect(contradictions[0].severity).toBe("major");
		expect(contradictions[0].category).toBe("direct_conflict");
	});

	it("returns empty when no contradictions found", async () => {
		const claims = [
			makeClaim({ id: "claim_1", paperId: "paper_1", themeIds: ["theme_1"] }),
			makeClaim({ id: "claim_2", paperId: "paper_2", themeIds: ["theme_1"] }),
		];

		mockExtractStructured.mockResolvedValue({ contradictions: [] });

		const contradictions = await detectContradictions(claims, [
			makePaper("paper_1"),
			makePaper("paper_2"),
		]);

		expect(contradictions).toEqual([]);
	});

	it("falls back to cross-paper comparison when claims lack themeIds", async () => {
		const claims = [
			makeClaim({ id: "claim_1", paperId: "paper_1", themeIds: [] }),
			makeClaim({ id: "claim_2", paperId: "paper_2", themeIds: [] }),
		];

		mockExtractStructured.mockResolvedValue({ contradictions: [] });

		await detectContradictions(claims, [makePaper("paper_1"), makePaper("paper_2")]);

		expect(mockExtractStructured).toHaveBeenCalledTimes(1);
	});

	it("skips claims from the same paper", async () => {
		const claims = [
			makeClaim({ id: "claim_1", paperId: "paper_1", themeIds: [] }),
			makeClaim({ id: "claim_2", paperId: "paper_1", themeIds: [] }),
		];

		const result = await detectContradictions(claims, [makePaper("paper_1")]);
		expect(result).toEqual([]);
		expect(mockExtractStructured).not.toHaveBeenCalled();
	});
});
