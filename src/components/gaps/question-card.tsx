import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ResearchQuestion } from "@/lib/types";

interface QuestionCardProps {
	question: ResearchQuestion;
}

export function QuestionCard({ question }: QuestionCardProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">{question.question}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<p className="text-sm text-muted-foreground">{question.rationale}</p>
				{question.suggestedMethodology && (
					<p className="text-xs text-muted-foreground">
						<span className="font-medium">Suggested methodology: </span>
						{question.suggestedMethodology}
					</p>
				)}
				<div className="space-y-1">
					<div className="flex items-center justify-between text-xs">
						<span className="text-muted-foreground">Priority</span>
						<span className="font-medium">{(question.priorityScore * 100).toFixed(0)}%</span>
					</div>
					<Progress value={question.priorityScore * 100} />
				</div>
			</CardContent>
		</Card>
	);
}
