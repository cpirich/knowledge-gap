"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Gap } from "@/lib/types";

const gapTypeColors: Record<string, string> = {
	unexplored_intersection: "bg-purple-100 text-purple-800",
	sparse_coverage: "bg-blue-100 text-blue-800",
	methodological_gap: "bg-green-100 text-green-800",
	temporal_gap: "bg-amber-100 text-amber-800",
	contradictory_area: "bg-red-100 text-red-800",
};

interface GapListProps {
	gaps: Gap[];
}

export function GapList({ gaps }: GapListProps) {
	if (gaps.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">No gaps identified yet</p>
				<p className="text-xs text-muted-foreground">Run analysis to discover knowledge gaps</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{gaps.map((gap) => (
				<Card key={gap.id}>
					<CardHeader>
						<div className="flex items-start justify-between gap-2">
							<CardTitle className="text-sm">{gap.title}</CardTitle>
							<Badge className={gapTypeColors[gap.type] ?? ""} variant="secondary">
								{gap.type.replace(/_/g, " ")}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-2">
						<p className="text-sm text-muted-foreground">{gap.description}</p>
						<div className="flex items-center gap-4 text-xs text-muted-foreground">
							<span>Confidence: {(gap.confidence * 100).toFixed(0)}%</span>
							<span>Impact: {gap.potentialImpact}</span>
						</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
