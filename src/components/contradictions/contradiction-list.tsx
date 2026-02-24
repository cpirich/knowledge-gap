"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Claim, Contradiction, Paper } from "@/lib/types";
import { SeverityBadge } from "./severity-badge";
import { SideBySideView } from "./side-by-side-view";

interface ContradictionListProps {
	contradictions: Contradiction[];
	claims: Map<string, Claim>;
	papers: Map<string, Paper>;
}

export function ContradictionList({ contradictions, claims, papers }: ContradictionListProps) {
	const [expanded, setExpanded] = useState<Set<string>>(new Set());

	if (contradictions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">No contradictions detected yet</p>
				<p className="text-xs text-muted-foreground">
					Upload and analyze papers to find contradictions
				</p>
			</div>
		);
	}

	const toggle = (id: string) => {
		setExpanded((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	return (
		<div className="space-y-3">
			{contradictions.map((c) => {
				const isExpanded = expanded.has(c.id);
				const claimA = claims.get(c.claimAId);
				const claimB = claims.get(c.claimBId);
				const paperA = papers.get(c.paperAId);
				const paperB = papers.get(c.paperBId);

				return (
					<Card key={c.id}>
						<CardHeader className="cursor-pointer" onClick={() => toggle(c.id)}>
							<div className="flex items-center gap-3">
								{isExpanded ? (
									<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
								) : (
									<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
								)}
								<div className="flex-1">
									<p className="text-sm font-medium">{c.description}</p>
								</div>
								<div className="flex items-center gap-2">
									<Badge variant="outline">{c.category.replace(/_/g, " ")}</Badge>
									<SeverityBadge severity={c.severity} />
								</div>
							</div>
						</CardHeader>
						{isExpanded && claimA && claimB && (
							<CardContent>
								<SideBySideView
									claimA={{
										statement: claimA.statement,
										paperTitle: paperA?.title ?? "Unknown paper",
									}}
									claimB={{
										statement: claimB.statement,
										paperTitle: paperB?.title ?? "Unknown paper",
									}}
								/>
								{c.resolution && (
									<p className="mt-3 text-xs text-muted-foreground">
										<span className="font-medium">Resolution: </span>
										{c.resolution}
									</p>
								)}
							</CardContent>
						)}
					</Card>
				);
			})}
		</div>
	);
}
