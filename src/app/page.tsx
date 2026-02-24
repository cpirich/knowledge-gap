"use client";

import { useEffect, useState } from "react";
import { DensityChart } from "@/components/dashboard/density-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePapers } from "@/hooks/use-papers";
import type { AnalysisResult, ApiResponse } from "@/lib/types";

export default function DashboardPage() {
	const { papers, loading: papersLoading } = usePapers();
	const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);

	useEffect(() => {
		async function loadAnalysis() {
			try {
				const res = await fetch("/api/analyze/latest");
				const json: ApiResponse<AnalysisResult> = await res.json();
				if (json.success && json.data) {
					setAnalysis(json.data);
				}
			} catch {
				// No analysis available yet
			}
		}
		loadAnalysis();
	}, []);

	const totalClaims = papers.reduce((sum, p) => sum + p.claimIds.length, 0);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Dashboard</h2>
				<p className="text-sm text-muted-foreground">Overview of your knowledge gap analysis</p>
			</div>

			<StatsCards
				totalPapers={papers.length}
				totalClaims={totalClaims}
				contradictions={analysis?.contradictions.length ?? 0}
				gaps={analysis?.gaps.length ?? 0}
			/>

			<div className="grid gap-4 lg:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Theme Density</CardTitle>
					</CardHeader>
					<CardContent>
						<DensityChart themes={analysis?.themes ?? []} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						{papersLoading ? (
							<p className="text-sm text-muted-foreground">Loading...</p>
						) : (
							<RecentActivity papers={papers} analysis={analysis} />
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
