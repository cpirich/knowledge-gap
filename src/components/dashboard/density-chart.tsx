"use client";

import { Bar, BarChart, Tooltip, XAxis, YAxis } from "recharts";
import { type ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { Theme } from "@/lib/types";

interface DensityChartProps {
	themes: Theme[];
}

const chartConfig: ChartConfig = {
	density: {
		label: "Density",
		color: "var(--chart-1)",
	},
};

export function DensityChart({ themes }: DensityChartProps) {
	if (themes.length === 0) {
		return (
			<div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
				<p className="text-sm text-muted-foreground">No theme data to display</p>
			</div>
		);
	}

	const data = themes.map((t) => ({
		name: t.label.length > 15 ? `${t.label.slice(0, 15)}...` : t.label,
		density: Math.round(t.density * 100),
	}));

	return (
		<ChartContainer config={chartConfig} className="h-[300px] w-full">
			<BarChart data={data} margin={{ top: 10, right: 10, bottom: 40, left: 10 }}>
				<XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
				<YAxis
					domain={[0, 100]}
					tick={{ fontSize: 11 }}
					label={{ value: "Density %", angle: -90, position: "insideLeft", fontSize: 11 }}
				/>
				<Tooltip content={<ChartTooltipContent />} />
				<Bar dataKey="density" fill="var(--color-density)" radius={[4, 4, 0, 0]} />
			</BarChart>
		</ChartContainer>
	);
}
