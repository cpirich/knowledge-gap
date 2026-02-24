"use client";

import { Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import type { Theme } from "@/lib/types";

interface IntersectionMatrixProps {
	themes: Theme[];
}

function densityToColor(density: number): string {
	const r = Math.round(59 + (239 - 59) * (1 - density));
	const g = Math.round(130 + (246 - 130) * (1 - density));
	const b = Math.round(246 + (239 - 246) * (1 - density));
	return `rgb(${r}, ${g}, ${b})`;
}

export function IntersectionMatrix({ themes }: IntersectionMatrixProps) {
	if (themes.length === 0) {
		return (
			<div className="flex items-center justify-center rounded-lg border border-dashed p-8">
				<p className="text-sm text-muted-foreground">No theme data available</p>
			</div>
		);
	}

	const data = themes.map((theme, i) => ({
		x: i,
		y: theme.density,
		name: theme.label,
		density: theme.density,
		claimCount: theme.claimIds.length,
	}));

	return (
		<div className="rounded-lg border p-4">
			<h4 className="mb-3 text-sm font-medium">Theme Density Distribution</h4>
			<ResponsiveContainer width="100%" height={300}>
				<ScatterChart margin={{ top: 10, right: 10, bottom: 30, left: 10 }}>
					<XAxis
						dataKey="x"
						name="Theme"
						tick={false}
						label={{ value: "Themes", position: "bottom", offset: 10 }}
					/>
					<YAxis
						dataKey="y"
						name="Density"
						domain={[0, 1]}
						label={{ value: "Density", angle: -90, position: "insideLeft" }}
					/>
					<Tooltip
						content={({ payload }) => {
							if (!payload?.[0]) return null;
							const d = payload[0].payload;
							return (
								<div className="rounded-md border bg-background p-2 text-xs shadow-md">
									<p className="font-medium">{d.name}</p>
									<p>Density: {(d.density * 100).toFixed(0)}%</p>
									<p>Claims: {d.claimCount}</p>
								</div>
							);
						}}
					/>
					<Scatter data={data}>
						{data.map((entry) => (
							<Cell
								key={entry.name}
								fill={densityToColor(entry.density)}
								r={8 + entry.claimCount * 2}
							/>
						))}
					</Scatter>
				</ScatterChart>
			</ResponsiveContainer>
		</div>
	);
}
