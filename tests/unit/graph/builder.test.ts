import { describe, expect, it } from "vitest";
import { buildGraphData } from "@/lib/graph/builder";
import type { AnalysisResult } from "@/lib/types";

const makeAnalysis = (overrides: Partial<AnalysisResult> = {}): AnalysisResult => ({
	id: "analysis_1",
	paperIds: ["paper_1"],
	themes: [],
	relationships: [],
	contradictions: [],
	gaps: [],
	questions: [],
	createdAt: new Date().toISOString(),
	status: "complete",
	...overrides,
});

describe("buildGraphData", () => {
	it("returns empty graph for empty analysis", () => {
		const result = buildGraphData(makeAnalysis());
		expect(result.nodes).toEqual([]);
		expect(result.edges).toEqual([]);
	});

	it("transforms themes to nodes with correct size and color", () => {
		const analysis = makeAnalysis({
			themes: [
				{
					id: "theme_1",
					label: "Machine Learning",
					description: "ML research",
					claimIds: ["c1", "c2", "c3", "c4", "c5"],
					paperIds: ["p1"],
					density: 0.8,
				},
				{
					id: "theme_2",
					label: "Ethics",
					description: "Ethics research",
					claimIds: ["c6"],
					paperIds: ["p2"],
					density: 0.1,
				},
			],
		});

		const result = buildGraphData(analysis);

		expect(result.nodes).toHaveLength(2);

		const mlNode = result.nodes.find((n) => n.data.id === "theme_1")!;
		expect(mlNode.data.label).toBe("Machine Learning");
		expect(mlNode.data.type).toBe("theme");
		expect(mlNode.data.size).toBeCloseTo(0.8 * 80 + 20); // 84
		expect(mlNode.data.density).toBe(0.8);
		expect(mlNode.data.claimCount).toBe(5);
		expect(mlNode.data.color).toBe("#3b82f6"); // 5 claims

		const ethicsNode = result.nodes.find((n) => n.data.id === "theme_2")!;
		expect(ethicsNode.data.size).toBeCloseTo(0.1 * 80 + 20); // 28
		expect(ethicsNode.data.claimCount).toBe(1);
		expect(ethicsNode.data.color).toBe("#93c5fd"); // 1 claim
	});

	it("transforms relationships to edges with correct colors", () => {
		const analysis = makeAnalysis({
			themes: [
				{
					id: "theme_1",
					label: "A",
					description: "",
					claimIds: [],
					paperIds: [],
					density: 0.5,
				},
				{
					id: "theme_2",
					label: "B",
					description: "",
					claimIds: [],
					paperIds: [],
					density: 0.5,
				},
			],
			relationships: [
				{
					id: "rel_1",
					sourceThemeId: "theme_1",
					targetThemeId: "theme_2",
					type: "supports",
					strength: 0.9,
					evidence: "Strong support",
				},
			],
		});

		const result = buildGraphData(analysis);

		expect(result.edges).toHaveLength(1);
		expect(result.edges[0].data.id).toBe("rel_1");
		expect(result.edges[0].data.source).toBe("theme_1");
		expect(result.edges[0].data.target).toBe("theme_2");
		expect(result.edges[0].data.type).toBe("supports");
		expect(result.edges[0].data.color).toBe("#22c55e");
		expect(result.edges[0].data.strength).toBe(0.9);
	});

	it("transforms gaps to red nodes and connects to related themes", () => {
		const analysis = makeAnalysis({
			themes: [
				{
					id: "theme_1",
					label: "A",
					description: "",
					claimIds: [],
					paperIds: [],
					density: 0.5,
				},
			],
			gaps: [
				{
					id: "gap_1",
					title: "Missing Link",
					description: "Gap description",
					type: "unexplored_intersection",
					relatedThemeIds: ["theme_1"],
					confidence: 0.7,
					evidence: "Evidence",
					potentialImpact: "Impact",
				},
			],
		});

		const result = buildGraphData(analysis);

		// theme node + gap node
		expect(result.nodes).toHaveLength(2);

		const gapNode = result.nodes.find((n) => n.data.id === "gap_1")!;
		expect(gapNode.data.type).toBe("gap");
		expect(gapNode.data.color).toBe("#ef4444");
		expect(gapNode.data.isGap).toBe(true);
		expect(gapNode.data.size).toBe(30);

		// Edge connecting gap to theme
		expect(result.edges).toHaveLength(1);
		expect(result.edges[0].data.source).toBe("gap_1");
		expect(result.edges[0].data.target).toBe("theme_1");
		expect(result.edges[0].data.color).toBe("#ef4444");
	});

	it("handles contradicts relationship type", () => {
		const analysis = makeAnalysis({
			themes: [
				{
					id: "theme_1",
					label: "A",
					description: "",
					claimIds: [],
					paperIds: [],
					density: 0.5,
				},
				{
					id: "theme_2",
					label: "B",
					description: "",
					claimIds: [],
					paperIds: [],
					density: 0.5,
				},
			],
			relationships: [
				{
					id: "rel_1",
					sourceThemeId: "theme_1",
					targetThemeId: "theme_2",
					type: "contradicts",
					strength: 0.6,
					evidence: "Contradiction",
				},
			],
		});

		const result = buildGraphData(analysis);
		expect(result.edges[0].data.color).toBe("#ef4444");
	});
});
