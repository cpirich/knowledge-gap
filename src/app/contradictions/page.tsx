"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import { ContradictionList } from "@/components/contradictions/contradiction-list";
import type { AnalysisResult, ApiResponse, Claim, Paper } from "@/lib/types";

export default function ContradictionsPage() {
	const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
	const [claims, setClaims] = useState<Map<string, Claim>>(new Map());
	const [papers, setPapers] = useState<Map<string, Paper>>(new Map());
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const [analysisRes, papersRes] = await Promise.all([
					fetch("/api/analyze/latest"),
					fetch("/api/papers"),
				]);
				const analysisJson: ApiResponse<AnalysisResult> = await analysisRes.json();
				const papersJson: ApiResponse<Paper[]> = await papersRes.json();

				if (analysisJson.success && analysisJson.data) {
					setAnalysis(analysisJson.data);
				}
				if (papersJson.success && papersJson.data) {
					setPapers(new Map(papersJson.data.map((p) => [p.id, p])));
				}

				// Fetch claims
				const claimsRes = await fetch("/api/claims");
				const claimsJson: ApiResponse<Claim[]> = await claimsRes.json();
				if (claimsJson.success && claimsJson.data) {
					setClaims(new Map(claimsJson.data.map((c) => [c.id, c])));
				}
			} catch {
				// Data not available yet
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<p className="text-sm text-muted-foreground">Loading...</p>
			</div>
		);
	}

	const contradictions = analysis?.contradictions ?? [];

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Contradictions</h2>
				<p className="text-sm text-muted-foreground">Conflicting claims found across papers</p>
			</div>
			{contradictions.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
					<AlertTriangle className="size-10 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No contradictions found yet</p>
					<p className="text-xs text-muted-foreground">
						Upload papers and run analysis to detect contradictions
					</p>
				</div>
			) : (
				<ContradictionList contradictions={contradictions} claims={claims} papers={papers} />
			)}
		</div>
	);
}
