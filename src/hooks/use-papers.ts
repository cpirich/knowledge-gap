"use client";

import { useCallback, useEffect, useState } from "react";
import { demoPapers, isStaticDemo } from "@/lib/demo/data";
import type { ApiResponse, Paper } from "@/lib/types";

export function usePapers() {
	const [papers, setPapers] = useState<Paper[]>(isStaticDemo ? demoPapers : []);
	const [loading, setLoading] = useState(!isStaticDemo);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (isStaticDemo) return;
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
		if (!isStaticDemo) refresh();
	}, [refresh]);

	return { papers, loading, error, refresh };
}
