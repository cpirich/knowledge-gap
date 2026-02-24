export type GraphNodeType = "theme" | "paper" | "gap";

export interface GraphNode {
	data: {
		id: string;
		label: string;
		type: GraphNodeType;
		size: number;
		color: string;
		density?: number;
		claimCount?: number;
		isGap?: boolean;
	};
}

export interface GraphEdge {
	data: {
		id: string;
		source: string;
		target: string;
		label: string;
		type: string;
		strength: number;
		color: string;
	};
}

export interface GraphData {
	nodes: GraphNode[];
	edges: GraphEdge[];
}
