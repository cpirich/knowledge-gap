"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, Paper } from "@/lib/types";

export function usePapers() {
	const [papers, setPapers] = useState<Paper[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/papers");
			const json: ApiResponse<Paper[]> = await res.json();
			if (json.success && json.data) {
				setPapers(json.data);
			} else {
				setError(json.error?.message ?? "Failed to fetch papers");
			}
		} catch {
			setError("Failed to fetch papers");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return { papers, loading, error, refresh };
}
