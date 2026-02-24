"use client";

import { useCallback, useState } from "react";
import type { AnalysisResult, ApiResponse } from "@/lib/types";

export function useAnalysis() {
	const [result, setResult] = useState<AnalysisResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const analyze = useCallback(async (paperIds: string[]) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ paperIds }),
			});
			const json: ApiResponse<AnalysisResult> = await res.json();
			if (json.success && json.data) {
				setResult(json.data);
				return json.data;
			}
			setError(json.error?.message ?? "Analysis failed");
			return null;
		} catch {
			setError("Analysis failed");
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchResult = useCallback(async (analysisId: string) => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch(`/api/analyze/${analysisId}`);
			const json: ApiResponse<AnalysisResult> = await res.json();
			if (json.success && json.data) {
				setResult(json.data);
				return json.data;
			}
			setError(json.error?.message ?? "Failed to fetch analysis");
			return null;
		} catch {
			setError("Failed to fetch analysis");
			return null;
		} finally {
			setLoading(false);
		}
	}, []);

	return { result, loading, error, analyze, fetchResult };
}
