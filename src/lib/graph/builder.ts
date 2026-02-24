import type { AnalysisResult, GraphData, GraphEdge, GraphNode } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const RELATIONSHIP_COLORS: Record<string, string> = {
	supports: "#22c55e",
	contradicts: "#ef4444",
	extends: "#3b82f6",
	prerequisite: "#f59e0b",
	parallel: "#8b5cf6",
	methodology_shared: "#06b6d4",
};

function themeColor(claimCount: number): string {
	if (claimCount >= 10) return "#1d4ed8";
	if (claimCount >= 5) return "#3b82f6";
	if (claimCount >= 2) return "#60a5fa";
	return "#93c5fd";
}

export function buildGraphData(analysis: AnalysisResult): GraphData {
	const nodes: GraphNode[] = [];
	const edges: GraphEdge[] = [];

	// Transform themes to nodes
	for (const theme of analysis.themes) {
		const size = theme.density * 80 + 20;
		nodes.push({
			data: {
				id: theme.id,
				label: theme.label,
				type: "theme",
				size,
				color: themeColor(theme.claimIds.length),
				density: theme.density,
				claimCount: theme.claimIds.length,
			},
		});
	}

	// Transform relationships to edges
	for (const rel of analysis.relationships) {
		edges.push({
			data: {
				id: rel.id,
				source: rel.sourceThemeId,
				target: rel.targetThemeId,
				label: rel.type,
				type: rel.type,
				strength: rel.strength,
				color: RELATIONSHIP_COLORS[rel.type] ?? "#6b7280",
			},
		});
	}

	// Transform gaps to red dashed nodes
	for (const gap of analysis.gaps) {
		nodes.push({
			data: {
				id: gap.id,
				label: gap.title,
				type: "gap",
				size: 30,
				color: "#ef4444",
				isGap: true,
			},
		});

		// Connect gap nodes to related themes
		for (const themeId of gap.relatedThemeIds) {
			edges.push({
				data: {
					id: generateId("edge"),
					source: gap.id,
					target: themeId,
					label: "gap",
					type: "gap",
					strength: gap.confidence,
					color: "#ef4444",
				},
			});
		}
	}

	return { nodes, edges };
}
