import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QuestionCard } from "@/components/gaps/question-card";
import type { ResearchQuestion } from "@/lib/types";

afterEach(cleanup);

const mockQuestion: ResearchQuestion = {
	id: "q1",
	gapId: "g1",
	question: "What are the long-term effects?",
	rationale: "Current studies only cover short-term outcomes",
	relatedThemeIds: ["t1"],
	suggestedMethodology: "Longitudinal cohort study",
	priorityScore: 0.72,
};

describe("QuestionCard", () => {
	it("renders the question text", () => {
		render(<QuestionCard question={mockQuestion} />);
		expect(screen.getByText("What are the long-term effects?")).toBeInTheDocument();
	});

	it("renders the rationale", () => {
		render(<QuestionCard question={mockQuestion} />);
		expect(screen.getByText("Current studies only cover short-term outcomes")).toBeInTheDocument();
	});

	it("renders suggested methodology when present", () => {
		const { container } = render(<QuestionCard question={mockQuestion} />);
		expect(container.textContent).toContain("Longitudinal cohort study");
	});

	it("renders priority score", () => {
		const { container } = render(<QuestionCard question={mockQuestion} />);
		expect(container.textContent).toContain("72%");
	});

	it("does not render methodology when absent", () => {
		const noMethodology = { ...mockQuestion, suggestedMethodology: undefined };
		const { container } = render(<QuestionCard question={noMethodology} />);
		expect(container.textContent).not.toContain("Suggested methodology");
	});
});
