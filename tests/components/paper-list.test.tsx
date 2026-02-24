import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PaperList } from "@/components/upload/paper-list";
import type { Paper } from "@/lib/types";

const mockPaper: Paper = {
	id: "p1",
	filename: "test.pdf",
	title: "Test Paper Title",
	authors: ["Author A", "Author B"],
	abstract: "Abstract text",
	uploadedAt: "2026-01-01T00:00:00Z",
	sourceType: "pdf",
	rawText: "raw text content",
	chunks: [],
	claimIds: ["c1", "c2", "c3"],
	status: "ready",
};

describe("PaperList", () => {
	it("shows empty state when no papers", () => {
		render(<PaperList papers={[]} />);
		expect(screen.getByText("No papers uploaded yet")).toBeInTheDocument();
	});

	it("renders paper title and authors", () => {
		render(<PaperList papers={[mockPaper]} />);
		expect(screen.getByText("Test Paper Title")).toBeInTheDocument();
		expect(screen.getByText("Author A, Author B")).toBeInTheDocument();
	});

	it("shows claim count in table", () => {
		const { container } = render(<PaperList papers={[mockPaper]} />);
		const cells = container.querySelectorAll("td");
		const claimCell = Array.from(cells).find((c) => c.textContent === "3");
		expect(claimCell).toBeTruthy();
	});

	it("shows status badge", () => {
		const { container } = render(<PaperList papers={[mockPaper]} />);
		const badge = container.querySelector("[data-slot='badge']");
		expect(badge).toHaveTextContent("ready");
	});

	it("shows filename when title is empty", () => {
		const paperNoTitle = { ...mockPaper, title: "" };
		render(<PaperList papers={[paperNoTitle]} />);
		expect(screen.getByText("test.pdf")).toBeInTheDocument();
	});

	it("renders delete button when onDelete is provided", () => {
		const onDelete = vi.fn();
		render(<PaperList papers={[mockPaper]} onDelete={onDelete} />);
		const deleteBtn = screen.getByRole("button");
		expect(deleteBtn).toBeInTheDocument();
	});
});
