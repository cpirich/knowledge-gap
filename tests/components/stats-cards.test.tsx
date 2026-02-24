import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsCards } from "@/components/dashboard/stats-cards";

describe("StatsCards", () => {
	it("renders all four stat cards with correct values", () => {
		render(<StatsCards totalPapers={5} totalClaims={42} contradictions={3} gaps={7} />);

		expect(screen.getByText("Total Papers")).toBeInTheDocument();
		expect(screen.getByText("5")).toBeInTheDocument();
		expect(screen.getByText("Total Claims")).toBeInTheDocument();
		expect(screen.getByText("42")).toBeInTheDocument();
		expect(screen.getByText("Contradictions")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
		expect(screen.getByText("Gaps Identified")).toBeInTheDocument();
		expect(screen.getByText("7")).toBeInTheDocument();
	});

	it("renders zero values correctly", () => {
		render(<StatsCards totalPapers={0} totalClaims={0} contradictions={0} gaps={0} />);

		const zeros = screen.getAllByText("0");
		expect(zeros).toHaveLength(4);
	});
});
