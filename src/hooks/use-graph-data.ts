"use client";

import { useCallback, useEffect, useState } from "react";
import { demoGraphData, isStaticDemo } from "@/lib/demo/data";
import type { ApiResponse, GraphData } from "@/lib/types";

export function useGraphData() {
	const [graphData, setGraphData] = useState<GraphData | null>(isStaticDemo ? demoGraphData : null);
	const [loading, setLoading] = useState(!isStaticDemo);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (isStaticDemo) return;
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/graph");
			const json: ApiResponse<GraphData> = await res.json();
			if (json.success && json.data) {
				setGraphData(json.data);
			} else {
				setError(json.error?.message ?? "Failed to fetch graph data");
			}
		} catch {
			setError("Failed to fetch graph data");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		if (!isStaticDemo) refresh();
	}, [refresh]);

	return { graphData, loading, error, refresh };
}
