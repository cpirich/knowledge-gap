import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Contradiction, Relationship, Theme } from "@/lib/types";

vi.mock("@/lib/ai/client", () => ({
	getClient: vi.fn(() => ({
		messages: { create: vi.fn() },
	})),
}));

vi.mock("@/lib/ai/structured", () => ({
	extractStructured: vi.fn(),
}));

import { extractStructured } from "@/lib/ai/structured";
import { findGaps } from "@/lib/analysis/gap-finder";

const mockExtractStructured = vi.mocked(extractStructured);

const makeTheme = (overrides: Partial<Theme> = {}): Theme => ({
	id: `theme_${Math.random().toString(36).slice(2, 8)}`,
	label: "Test Theme",
	description: "A test theme",
	claimIds: ["claim_1"],
	paperIds: ["paper_1"],
	density: 0.5,
	...overrides,
});

const makeRelationship = (overrides: Partial<Relationship> = {}): Relationship => ({
	id: `rel_${Math.random().toString(36).slice(2, 8)}`,
	sourceThemeId: "theme_1",
	targetThemeId: "theme_2",
	type: "supports",
	strength: 0.8,
	evidence: "Evidence",
	...overrides,
});

const makeContradiction = (overrides: Partial<Contradiction> = {}): Contradiction => ({
	id: `contra_${Math.random().toString(36).slice(2, 8)}`,
	claimAId: "claim_1",
	claimBId: "claim_2",
	paperAId: "paper_1",
	paperBId: "paper_2",
	description: "Test contradiction",
	severity: "major",
	category: "direct_conflict",
	...overrides,
});

describe("findGaps", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns empty array for empty themes", async () => {
		const result = await findGaps([], [], []);
		expect(result).toEqual([]);
		expect(mockExtractStructured).not.toHaveBeenCalled();
	});

	it("identifies gaps from themes and relationships", async () => {
		const themes = [
			makeTheme({ id: "theme_1", label: "Machine Learning", density: 0.6 }),
			makeTheme({ id: "theme_2", label: "Ethics", density: 0.1 }),
		];
		const relationships = [
			makeRelationship({ sourceThemeId: "theme_1", targetThemeId: "theme_2" }),
		];

		mockExtractStructured.mockResolvedValue({
			gaps: [
				{
					title: "Ethics in ML Training Data",
					description: "Insufficient study of ethical considerations in training data",
					type: "sparse_coverage",
					relatedThemeIds: ["theme_2"],
					confidence: 0.85,
					evidence: "Low density in Ethics theme",
					potentialImpact: "Crucial for responsible AI development",
				},
			],
		});

		const gaps = await findGaps(themes, relationships, []);

		expect(gaps).toHaveLength(1);
		expect(gaps[0].id).toMatch(/^gap_/);
		expect(gaps[0].title).toBe("Ethics in ML Training Data");
		expect(gaps[0].type).toBe("sparse_coverage");
		expect(gaps[0].relatedThemeIds).toEqual(["theme_2"]);
	});

	it("filters out invalid theme IDs from AI response", async () => {
		const themes = [makeTheme({ id: "theme_1" })];

		mockExtractStructured.mockResolvedValue({
			gaps: [
				{
					title: "Gap",
					description: "Desc",
					type: "methodological_gap",
					relatedThemeIds: ["theme_1", "nonexistent"],
					confidence: 0.7,
					evidence: "Evidence",
					potentialImpact: "Impact",
				},
			],
		});

		const gaps = await findGaps(themes, [], []);

		expect(gaps[0].relatedThemeIds).toEqual(["theme_1"]);
	});

	it("passes contradiction areas to prompt", async () => {
		const themes = [makeTheme({ id: "theme_1" })];
		const contradictions = [makeContradiction({ description: "X vs Y" })];

		mockExtractStructured.mockResolvedValue({ gaps: [] });

		await findGaps(themes, [], contradictions);

		expect(mockExtractStructured).toHaveBeenCalledTimes(1);
		const call = mockExtractStructured.mock.calls[0][0];
		expect(call.prompt).toContain("X vs Y");
	});
});
