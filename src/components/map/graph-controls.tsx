"use client";

import { LayoutGrid, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GraphControlsProps {
	layout: string;
	onLayoutChange: (layout: string) => void;
	filters: { themes: boolean; gaps: boolean; papers: boolean };
	onFiltersChange: (filters: { themes: boolean; gaps: boolean; papers: boolean }) => void;
	onZoomIn?: () => void;
	onZoomOut?: () => void;
}

const layouts = [
	{ value: "cose", label: "Force-directed (cose)" },
	{ value: "circle", label: "Circle" },
	{ value: "breadthfirst", label: "Breadth-first" },
];

export function GraphControls({
	layout,
	onLayoutChange,
	filters,
	onFiltersChange,
	onZoomIn,
	onZoomOut,
}: GraphControlsProps) {
	return (
		<div className="flex items-center gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm">
						<LayoutGrid className="mr-1 size-3.5" />
						Layout
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start">
					<DropdownMenuRadioGroup value={layout} onValueChange={onLayoutChange}>
						{layouts.map((l) => (
							<DropdownMenuRadioItem key={l.value} value={l.value}>
								{l.label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>

			<Button variant="outline" size="icon-sm" onClick={onZoomIn}>
				<ZoomIn />
			</Button>
			<Button variant="outline" size="icon-sm" onClick={onZoomOut}>
				<ZoomOut />
			</Button>

			<div className="ml-2 flex items-center gap-3">
				{(["themes", "gaps", "papers"] as const).map((key) => (
					<label key={key} className="flex items-center gap-1.5 text-xs">
						<input
							type="checkbox"
							checked={filters[key]}
							onChange={(e) => onFiltersChange({ ...filters, [key]: e.target.checked })}
							className="accent-primary"
						/>
						{key.charAt(0).toUpperCase() + key.slice(1)}
					</label>
				))}
			</div>
		</div>
	);
}
