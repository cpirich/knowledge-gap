import { AlertTriangle, FileText, HelpCircle, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
	totalPapers: number;
	totalClaims: number;
	contradictions: number;
	gaps: number;
}

const stats = [
	{ key: "totalPapers", label: "Total Papers", icon: FileText },
	{ key: "totalClaims", label: "Total Claims", icon: MessageSquare },
	{ key: "contradictions", label: "Contradictions", icon: AlertTriangle },
	{ key: "gaps", label: "Gaps Identified", icon: HelpCircle },
] as const;

export function StatsCards(props: StatsCardsProps) {
	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{stats.map(({ key, label, icon: Icon }) => (
				<Card key={key}>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm font-medium">{label}</CardTitle>
						<Icon className="size-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{props[key]}</div>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
