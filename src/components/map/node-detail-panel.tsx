"use client";

import { Badge } from "@/components/ui/badge";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import type { GraphNode } from "@/lib/types";

interface NodeDetailPanelProps {
	node: GraphNode["data"] | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NodeDetailPanel({ node, open, onOpenChange }: NodeDetailPanelProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>{node?.label ?? "Node Details"}</SheetTitle>
					<SheetDescription>
						{node?.type ? `Type: ${node.type}` : "Select a node to view details"}
					</SheetDescription>
				</SheetHeader>
				{node && (
					<div className="space-y-4 px-4">
						<div className="flex items-center gap-2">
							<Badge variant={node.isGap ? "destructive" : "secondary"}>{node.type}</Badge>
							{node.density !== undefined && (
								<span className="text-xs text-muted-foreground">
									Density: {(node.density * 100).toFixed(0)}%
								</span>
							)}
						</div>
						{node.claimCount !== undefined && (
							<div className="text-sm">
								<span className="text-muted-foreground">Claims: </span>
								<span className="font-medium">{node.claimCount}</span>
							</div>
						)}
						<div className="text-sm">
							<span className="text-muted-foreground">ID: </span>
							<span className="font-mono text-xs">{node.id}</span>
						</div>
					</div>
				)}
			</SheetContent>
		</Sheet>
	);
}
