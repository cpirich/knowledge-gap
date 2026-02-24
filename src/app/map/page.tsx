"use client";

import { Network } from "lucide-react";
import { useState } from "react";
import { GraphControls } from "@/components/map/graph-controls";
import { KnowledgeGraph } from "@/components/map/knowledge-graph";
import { NodeDetailPanel } from "@/components/map/node-detail-panel";
import { useGraphData } from "@/hooks/use-graph-data";
import type { GraphNode } from "@/lib/types";

export default function MapPage() {
	const { graphData, loading, error } = useGraphData();
	const [layout, setLayout] = useState("cose");
	const [filters, setFilters] = useState({ themes: true, gaps: true, papers: true });
	const [selectedNode, setSelectedNode] = useState<GraphNode["data"] | null>(null);
	const [detailOpen, setDetailOpen] = useState(false);

	const handleNodeClick = (nodeData: GraphNode["data"]) => {
		setSelectedNode(nodeData);
		setDetailOpen(true);
	};

	if (loading) {
		return (
			<div className="flex h-[calc(100vh-8rem)] items-center justify-center">
				<p className="text-sm text-muted-foreground">Loading graph data...</p>
			</div>
		);
	}

	if (error || !graphData) {
		return (
			<div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3">
				<Network className="size-10 text-muted-foreground/50" />
				<p className="text-sm text-muted-foreground">{error ?? "No graph data available"}</p>
				<p className="text-xs text-muted-foreground">
					Upload and analyze papers to generate the knowledge map
				</p>
			</div>
		);
	}

	if (graphData.nodes.length === 0) {
		return (
			<div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center gap-3">
				<Network className="size-10 text-muted-foreground/50" />
				<p className="text-sm text-muted-foreground">No data to visualize yet</p>
				<p className="text-xs text-muted-foreground">
					Upload papers and run analysis to build the knowledge map
				</p>
			</div>
		);
	}

	return (
		<div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
			<GraphControls
				layout={layout}
				onLayoutChange={setLayout}
				filters={filters}
				onFiltersChange={setFilters}
			/>
			<div className="flex-1">
				<KnowledgeGraph
					data={graphData}
					layout={layout}
					filters={filters}
					onNodeClick={handleNodeClick}
				/>
			</div>
			<NodeDetailPanel node={selectedNode} open={detailOpen} onOpenChange={setDetailOpen} />
		</div>
	);
}
