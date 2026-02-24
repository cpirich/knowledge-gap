import { Badge } from "@/components/ui/badge";
import type { ContradictionSeverity } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<ContradictionSeverity, string> = {
	critical: "bg-red-500 text-white hover:bg-red-500/90",
	major: "bg-orange-500 text-white hover:bg-orange-500/90",
	minor: "bg-yellow-500 text-white hover:bg-yellow-500/90",
};

interface SeverityBadgeProps {
	severity: ContradictionSeverity;
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
	return <Badge className={cn(severityStyles[severity])}>{severity}</Badge>;
}
