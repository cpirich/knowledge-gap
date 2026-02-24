"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, GraphData } from "@/lib/types";

export function useGraphData() {
	const [graphData, setGraphData] = useState<GraphData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
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
		refresh();
	}, [refresh]);

	return { graphData, loading, error, refresh };
}
