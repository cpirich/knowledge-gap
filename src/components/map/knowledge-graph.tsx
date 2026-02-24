"use client";

import dynamic from "next/dynamic";
import { useCallback, useRef } from "react";
import type { GraphData, GraphNode } from "@/lib/types";

const CytoscapeComponent = dynamic(() => import("react-cytoscapejs"), {
	ssr: false,
});

interface KnowledgeGraphProps {
	data: GraphData;
	layout: string;
	filters: { themes: boolean; gaps: boolean; papers: boolean };
	onNodeClick?: (node: GraphNode["data"]) => void;
}

export function KnowledgeGraph({ data, layout, filters, onNodeClick }: KnowledgeGraphProps) {
	const cyRef = useRef<cytoscape.Core | null>(null);

	const filteredNodes = data.nodes.filter((n) => {
		if (n.data.type === "theme" && !filters.themes) return false;
		if (n.data.type === "gap" && !filters.gaps) return false;
		if (n.data.type === "paper" && !filters.papers) return false;
		return true;
	});

	const nodeIds = new Set(filteredNodes.map((n) => n.data.id));
	const filteredEdges = data.edges.filter(
		(e) => nodeIds.has(e.data.source) && nodeIds.has(e.data.target),
	);

	const elements = [
		...filteredNodes.map((n) => ({ data: n.data, group: "nodes" as const })),
		...filteredEdges.map((e) => ({ data: e.data, group: "edges" as const })),
	];

	const handleCy = useCallback(
		(cy: cytoscape.Core) => {
			cyRef.current = cy;
			cy.removeListener("tap", "node");
			cy.on("tap", "node", (evt) => {
				const nodeData = evt.target.data();
				onNodeClick?.(nodeData);
			});
		},
		[onNodeClick],
	);

	return (
		<div className="h-full w-full rounded-lg border bg-background">
			<CytoscapeComponent
				elements={elements}
				layout={{ name: layout, animate: true, padding: 40 } as cytoscape.LayoutOptions}
				style={{ width: "100%", height: "100%" }}
				stylesheet={[
					{
						selector: "node",
						style: {
							label: "data(label)",
							width: "data(size)",
							height: "data(size)",
							"background-color": "data(color)",
							color: "#333",
							"font-size": "10px",
							"text-wrap": "wrap" as const,
							"text-max-width": "80px",
							"text-valign": "bottom" as const,
							"text-margin-y": 4,
						},
					},
					{
						selector: "node[?isGap]",
						style: {
							"border-width": 2,
							"border-style": "dashed",
							"border-color": "#ef4444",
							"background-color": "#fecaca",
						},
					},
					{
						selector: "edge",
						style: {
							width: 2,
							"line-color": "data(color)",
							"curve-style": "bezier" as const,
							"target-arrow-shape": "triangle" as const,
							"target-arrow-color": "data(color)",
							label: "data(label)",
							"font-size": "8px",
							color: "#666",
							"text-rotation": "autorotate" as const,
						},
					},
					{
						selector: "node:selected",
						style: {
							"border-width": 3,
							"border-color": "#2563eb",
						},
					},
				]}
				cy={handleCy}
			/>
		</div>
	);
}
