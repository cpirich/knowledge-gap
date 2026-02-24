"use client";

import { Progress } from "@/components/ui/progress";

const stages = [
	{ label: "Extracting text", threshold: 20 },
	{ label: "Chunking", threshold: 50 },
	{ label: "Extracting claims", threshold: 80 },
	{ label: "Complete", threshold: 100 },
];

interface UploadProgressProps {
	progress: number;
	visible: boolean;
}

export function UploadProgress({ progress, visible }: UploadProgressProps) {
	if (!visible) return null;

	const currentStage = stages.find((s) => progress <= s.threshold) ?? stages[stages.length - 1];

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex items-center justify-between text-sm">
				<span className="font-medium">{currentStage.label}...</span>
				<span className="text-muted-foreground">{progress}%</span>
			</div>
			<Progress value={progress} />
			<div className="flex justify-between">
				{stages.map((stage) => (
					<span
						key={stage.label}
						className={`text-xs ${progress >= stage.threshold ? "text-primary font-medium" : "text-muted-foreground"}`}
					>
						{stage.label}
					</span>
				))}
			</div>
		</div>
	);
}
