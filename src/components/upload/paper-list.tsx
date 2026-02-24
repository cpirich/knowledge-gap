"use client";

import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Paper } from "@/lib/types";

interface PaperListProps {
	papers: Paper[];
	onDelete?: (id: string) => void;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
	ready: "default",
	error: "destructive",
	uploading: "secondary",
	extracting_text: "secondary",
	chunking: "secondary",
	extracting_claims: "secondary",
};

export function PaperList({ papers, onDelete }: PaperListProps) {
	if (papers.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center">
				<p className="text-sm text-muted-foreground">No papers uploaded yet</p>
				<p className="text-xs text-muted-foreground">Upload PDF or text files to get started</p>
			</div>
		);
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Title</TableHead>
					<TableHead>Authors</TableHead>
					<TableHead className="text-right">Claims</TableHead>
					<TableHead>Status</TableHead>
					<TableHead className="w-10" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{papers.map((paper) => (
					<TableRow key={paper.id}>
						<TableCell className="max-w-[200px] truncate font-medium">
							{paper.title || paper.filename}
						</TableCell>
						<TableCell className="max-w-[150px] truncate text-muted-foreground">
							{paper.authors.length > 0 ? paper.authors.join(", ") : "—"}
						</TableCell>
						<TableCell className="text-right">{paper.claimIds.length}</TableCell>
						<TableCell>
							<Badge variant={statusVariant[paper.status] ?? "outline"}>
								{paper.status.replace(/_/g, " ")}
							</Badge>
						</TableCell>
						<TableCell>
							{onDelete && (
								<Button variant="ghost" size="icon-xs" onClick={() => onDelete(paper.id)}>
									<Trash2 className="size-3.5 text-muted-foreground" />
								</Button>
							)}
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}
