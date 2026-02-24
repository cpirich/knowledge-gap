import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SideBySideViewProps {
	claimA: { statement: string; paperTitle: string };
	claimB: { statement: string; paperTitle: string };
}

export function SideBySideView({ claimA, claimB }: SideBySideViewProps) {
	return (
		<div className="grid grid-cols-2 gap-3">
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-xs text-muted-foreground">{claimA.paperTitle}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm">{claimA.statement}</p>
				</CardContent>
			</Card>
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-xs text-muted-foreground">{claimB.paperTitle}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm">{claimB.statement}</p>
				</CardContent>
			</Card>
		</div>
	);
}
