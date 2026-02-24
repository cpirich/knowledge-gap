"use client";

import { HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { GapList } from "@/components/gaps/gap-list";
import { IntersectionMatrix } from "@/components/gaps/intersection-matrix";
import { QuestionCard } from "@/components/gaps/question-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalysisResult, ApiResponse } from "@/lib/types";

export default function GapsPage() {
	const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch("/api/analyze/latest");
				const json: ApiResponse<AnalysisResult> = await res.json();
				if (json.success && json.data) {
					setAnalysis(json.data);
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

	const gaps = analysis?.gaps ?? [];
	const questions = analysis?.questions ?? [];
	const themes = analysis?.themes ?? [];

	if (gaps.length === 0 && questions.length === 0) {
		return (
			<div className="mx-auto max-w-4xl space-y-6">
				<div>
					<h2 className="text-lg font-semibold">Gaps & Questions</h2>
					<p className="text-sm text-muted-foreground">
						Knowledge gaps and generated research questions
					</p>
				</div>
				<div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
					<HelpCircle className="size-10 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">No gaps or questions found yet</p>
					<p className="text-xs text-muted-foreground">
						Upload papers and run analysis to identify knowledge gaps
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-4xl space-y-6">
			<div>
				<h2 className="text-lg font-semibold">Gaps & Questions</h2>
				<p className="text-sm text-muted-foreground">
					Knowledge gaps and generated research questions
				</p>
			</div>
			<Tabs defaultValue="gaps">
				<TabsList>
					<TabsTrigger value="gaps">Gaps ({gaps.length})</TabsTrigger>
					<TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
					<TabsTrigger value="matrix">Intersection Matrix</TabsTrigger>
				</TabsList>
				<TabsContent value="gaps">
					<GapList gaps={gaps} />
				</TabsContent>
				<TabsContent value="questions">
					<div className="space-y-3">
						{questions.map((q) => (
							<QuestionCard key={q.id} question={q} />
						))}
					</div>
				</TabsContent>
				<TabsContent value="matrix">
					<IntersectionMatrix themes={themes} />
				</TabsContent>
			</Tabs>
		</div>
	);
}
