import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GapList } from "@/components/gaps/gap-list";
import type { Gap } from "@/lib/types";

const mockGap: Gap = {
	id: "g1",
	title: "Missing longitudinal studies",
	description: "No long-term studies found in this area",
	type: "temporal_gap",
	relatedThemeIds: ["t1"],
	confidence: 0.85,
	evidence: "Only cross-sectional studies identified",
	potentialImpact: "High",
};

describe("GapList", () => {
	it("shows empty state when no gaps", () => {
		render(<GapList gaps={[]} />);
		expect(screen.getByText("No gaps identified yet")).toBeInTheDocument();
	});

	it("renders gap title and description", () => {
		render(<GapList gaps={[mockGap]} />);
		expect(screen.getByText("Missing longitudinal studies")).toBeInTheDocument();
		expect(screen.getByText("No long-term studies found in this area")).toBeInTheDocument();
	});

	it("renders gap type badge", () => {
		const { container } = render(<GapList gaps={[mockGap]} />);
		const badge = container.querySelector("[data-slot='badge']");
		expect(badge).toHaveTextContent("temporal gap");
	});

	it("displays confidence and impact info", () => {
		const { container } = render(<GapList gaps={[mockGap]} />);
		const infoDiv = container.querySelector(".text-xs.text-muted-foreground");
		expect(infoDiv).toBeInTheDocument();
		expect(infoDiv?.textContent).toContain("85%");
		expect(infoDiv?.textContent).toContain("High");
	});
});
