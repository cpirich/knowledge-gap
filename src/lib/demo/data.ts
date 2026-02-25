import { buildGraphData } from "@/lib/graph/builder";
import type { AnalysisResult, Claim, GraphData, Paper } from "@/lib/types";
import analysisFixture from "../../../tests/fixtures/analysis-results.json";
import claimsFixture from "../../../tests/fixtures/extracted-claims.json";

export const isStaticDemo = process.env.NEXT_PUBLIC_STATIC_DEMO === "1";

export const demoAnalysis = analysisFixture as unknown as AnalysisResult;

export const demoClaims = claimsFixture as unknown as Claim[];

export const demoPapers: Paper[] = [
	{
		id: "paper_fixture_1",
		filename: "sleep-memory-consolidation-review.pdf",
		title: "Sleep-Dependent Memory Consolidation: A Comprehensive Review",
		authors: ["Walker, M.P.", "Stickgold, R."],
		abstract:
			"This review examines the role of sleep in memory consolidation, covering SWS and declarative memory, REM sleep and procedural/emotional memory, and sleep spindle contributions.",
		uploadedAt: "2026-01-15T09:00:00.000Z",
		sourceType: "pdf",
		rawText: "",
		chunks: [],
		claimIds: [
			"claim_fixture_1",
			"claim_fixture_2",
			"claim_fixture_3",
			"claim_fixture_4",
			"claim_fixture_5",
		],
		status: "ready",
	},
	{
		id: "paper_fixture_2",
		filename: "targeted-memory-reactivation-during-sleep.pdf",
		title: "Targeted Memory Reactivation During Sleep: Mechanisms and Applications",
		authors: ["Rasch, B.", "Born, J."],
		abstract:
			"This paper investigates targeted memory reactivation techniques during slow-wave sleep and their effects on declarative memory consolidation.",
		uploadedAt: "2026-01-15T09:30:00.000Z",
		sourceType: "pdf",
		rawText: "",
		chunks: [],
		claimIds: [],
		status: "ready",
	},
];

export const demoGraphData: GraphData = buildGraphData(demoAnalysis);

export const demoClaimsMap = new Map(demoClaims.map((c) => [c.id, c]));
export const demoPapersMap = new Map(demoPapers.map((p) => [p.id, p]));
