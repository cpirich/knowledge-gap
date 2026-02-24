import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Claim } from "@/lib/types";

vi.mock("@/lib/ai/client", () => ({
	getClient: vi.fn(() => ({
		messages: { create: vi.fn() },
	})),
}));

vi.mock("@/lib/ai/structured", () => ({
	extractStructured: vi.fn(),
}));

import { extractStructured } from "@/lib/ai/structured";
import { clusterThemes } from "@/lib/analysis/theme-clusterer";

const mockExtractStructured = vi.mocked(extractStructured);

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

describe("clusterThemes", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty array for empty claims", async () => {
		const result = await clusterThemes([]);
		expect(result).toEqual([]);
		expect(mockExtractStructured).not.toHaveBeenCalled();
	});

	it("clusters claims into themes with proper IDs and density", async () => {
		const claims = [
			makeClaim({ id: "claim_1", paperId: "paper_1", statement: "Finding about X" }),
			makeClaim({ id: "claim_2", paperId: "paper_1", statement: "Finding about X related" }),
			makeClaim({ id: "claim_3", paperId: "paper_2", statement: "Finding about Y" }),
		];

		mockExtractStructured.mockResolvedValue({
			themes: [
				{
					label: "Theme X",
					description: "Research about X",
					claimIds: ["claim_1", "claim_2"],
				},
				{
					label: "Theme Y",
					description: "Research about Y",
					claimIds: ["claim_3"],
				},
			],
		});

		const themes = await clusterThemes(claims);

		expect(themes).toHaveLength(2);
		expect(themes[0].id).toMatch(/^theme_/);
		expect(themes[0].label).toBe("Theme X");
		expect(themes[0].description).toBe("Research about X");
		expect(themes[0].claimIds).toEqual(["claim_1", "claim_2"]);
		expect(themes[0].paperIds).toEqual(["paper_1"]);
		expect(themes[0].density).toBeCloseTo(2 / 3);

		expect(themes[1].label).toBe("Theme Y");
		expect(themes[1].claimIds).toEqual(["claim_3"]);
		expect(themes[1].paperIds).toEqual(["paper_2"]);
		expect(themes[1].density).toBeCloseTo(1 / 3);
	});

	it("filters out invalid claim IDs from AI response", async () => {
		const claims = [makeClaim({ id: "claim_1", paperId: "paper_1" })];

		mockExtractStructured.mockResolvedValue({
			themes: [
				{
					label: "Theme",
					description: "Desc",
					claimIds: ["claim_1", "nonexistent_claim"],
				},
			],
		});

		const themes = await clusterThemes(claims);

		expect(themes[0].claimIds).toEqual(["claim_1"]);
		expect(themes[0].density).toBe(1);
	});

	it("collects paperIds from multiple papers", async () => {
		const claims = [
			makeClaim({ id: "claim_1", paperId: "paper_1" }),
			makeClaim({ id: "claim_2", paperId: "paper_2" }),
		];

		mockExtractStructured.mockResolvedValue({
			themes: [
				{
					label: "Multi-paper Theme",
					description: "Spans papers",
					claimIds: ["claim_1", "claim_2"],
				},
			],
		});

		const themes = await clusterThemes(claims);

		expect(themes[0].paperIds).toContain("paper_1");
		expect(themes[0].paperIds).toContain("paper_2");
		expect(themes[0].paperIds).toHaveLength(2);
	});
});
