import { FileText, Network } from "lucide-react";
import type { AnalysisResult, Paper } from "@/lib/types";

interface RecentActivityProps {
	papers: Paper[];
	analysis: AnalysisResult | null;
}

interface ActivityItem {
	id: string;
	icon: React.ElementType;
	message: string;
	timestamp: string;
}

export function RecentActivity({ papers, analysis }: RecentActivityProps) {
	const activities: ActivityItem[] = [];

	for (const paper of papers.slice(-5).reverse()) {
		activities.push({
			id: `paper-${paper.id}`,
			icon: FileText,
			message: `Uploaded "${paper.title || paper.filename}"`,
			timestamp: paper.uploadedAt,
		});
	}

	if (analysis) {
		activities.push({
			id: `analysis-${analysis.id}`,
			icon: Network,
			message: `Analysis completed: ${analysis.themes.length} themes, ${analysis.contradictions.length} contradictions, ${analysis.gaps.length} gaps`,
			timestamp: analysis.createdAt,
		});
	}

	activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

	if (activities.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">No recent activity</p>
				<p className="text-xs text-muted-foreground">Upload papers to get started</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{activities.slice(0, 8).map((activity) => (
				<div key={activity.id} className="flex items-start gap-3">
					<div className="mt-0.5 rounded-full bg-muted p-1.5">
						<activity.icon className="size-3.5 text-muted-foreground" />
					</div>
					<div className="flex-1">
						<p className="text-sm">{activity.message}</p>
						<p className="text-xs text-muted-foreground">
							{new Date(activity.timestamp).toLocaleDateString()}
						</p>
					</div>
				</div>
			))}
		</div>
	);
}
