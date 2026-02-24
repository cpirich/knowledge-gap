import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Paper } from "@/lib/types";

// Mock the AI client module before importing anything that uses it
vi.mock("@/lib/ai/client", () => ({
	getClient: vi.fn(() => ({
		messages: {
			create: vi.fn(),
		},
	})),
}));

// Mock pdf-parse
vi.mock("pdf-parse", () => {
	class MockPDFParse {
		async getText() {
			return {
				text: "Sample extracted PDF text.\n\nThis is the second paragraph with research content.",
				total: 2,
				pages: [],
			};
		}
		async destroy() {}
	}
	return { PDFParse: MockPDFParse };
});

// Mock the structured extraction
vi.mock("@/lib/ai/structured", () => ({
	extractStructured: vi.fn(),
}));

// Mock the claim extractor
vi.mock("@/lib/ingestion/claim-extractor", () => ({
	extractClaims: vi.fn(),
}));

// Mock the store to avoid filesystem operations
vi.mock("@/lib/store/paper-store", () => {
	const papers = new Map<string, Paper>();
	return {
		addPaper: vi.fn((paper: Paper) => {
			papers.set(paper.id, paper);
		}),
		updatePaper: vi.fn((id: string, updates: Partial<Paper>) => {
			const existing = papers.get(id);
			if (!existing) throw new Error(`Paper not found: ${id}`);
			const updated = { ...existing, ...updates };
			papers.set(id, updated);
			return updated;
		}),
		getPaper: vi.fn((id: string) => papers.get(id)),
		addClaim: vi.fn(),
		_reset: () => papers.clear(),
	};
});

import { extractStructured } from "@/lib/ai/structured";
import { extractClaims } from "@/lib/ingestion/claim-extractor";
import { ingestPaper } from "@/lib/ingestion/pipeline";

const mockExtractStructured = vi.mocked(extractStructured);
const mockExtractClaims = vi.mocked(extractClaims);

describe("ingestPaper", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Default metadata response
		mockExtractStructured.mockResolvedValue({
			title: "Test Paper Title",
			authors: ["Author A", "Author B"],
			abstract: "This is the abstract.",
		});

		// Default claims response
		mockExtractClaims.mockResolvedValue([
			{
				id: "claim_1",
				paperId: "paper_1",
				chunkId: "chunk_1",
				type: "finding",
				statement: "Test finding",
				evidence: "Test evidence",
				confidence: "high",
				themeIds: [],
				metadata: {},
			},
		]);
	});

	it("returns a Paper with status 'ready' on successful text ingestion", async () => {
		const buffer = Buffer.from(
			"Sample paper text.\n\nThis is the second paragraph with research content.",
		);

		const paper = await ingestPaper({
			buffer,
			filename: "test.txt",
			sourceType: "text",
		});

		expect(paper.status).toBe("ready");
		expect(paper.title).toBe("Test Paper Title");
		expect(paper.authors).toEqual(["Author A", "Author B"]);
		expect(paper.abstract).toBe("This is the abstract.");
		expect(paper.sourceType).toBe("text");
		expect(paper.filename).toBe("test.txt");
		expect(paper.rawText).toContain("Sample paper text");
		expect(paper.chunks.length).toBeGreaterThan(0);
		expect(paper.claimIds.length).toBeGreaterThan(0);
	});

	it("returns a Paper with status 'ready' on successful PDF ingestion", async () => {
		const buffer = Buffer.from("fake pdf content");

		const paper = await ingestPaper({
			buffer,
			filename: "test.pdf",
			sourceType: "pdf",
		});

		expect(paper.status).toBe("ready");
		expect(paper.sourceType).toBe("pdf");
	});

	it("sets status to 'error' when text file is empty", async () => {
		const buffer = Buffer.from("   ");

		await expect(
			ingestPaper({
				buffer,
				filename: "empty.txt",
				sourceType: "text",
			}),
		).rejects.toThrow("Text file is empty");
	});

	it("sets status to 'error' when metadata extraction fails", async () => {
		mockExtractStructured.mockRejectedValue(new Error("AI service unavailable"));

		const buffer = Buffer.from("Some valid text content.\n\nAnother paragraph.");

		await expect(
			ingestPaper({
				buffer,
				filename: "test.txt",
				sourceType: "text",
			}),
		).rejects.toThrow("AI service unavailable");
	});

	it("extracts claims in parallel batches", async () => {
		// Create text that will produce multiple chunks
		const paragraphs: string[] = [];
		for (let i = 0; i < 20; i++) {
			paragraphs.push(`Paragraph ${i}: ${"Research content to fill the chunk. ".repeat(15)}`);
		}
		const buffer = Buffer.from(paragraphs.join("\n\n"));

		const paper = await ingestPaper({
			buffer,
			filename: "multi.txt",
			sourceType: "text",
		});

		expect(paper.status).toBe("ready");
		// extractClaims should have been called for each chunk
		expect(mockExtractClaims).toHaveBeenCalled();
		expect(mockExtractClaims.mock.calls.length).toBe(paper.chunks.length);
	});

	it("generates unique paper IDs", async () => {
		const buffer = Buffer.from("Some text content.\n\nMore content.");

		const paper1 = await ingestPaper({
			buffer,
			filename: "test1.txt",
			sourceType: "text",
		});
		const paper2 = await ingestPaper({
			buffer,
			filename: "test2.txt",
			sourceType: "text",
		});

		expect(paper1.id).not.toBe(paper2.id);
		expect(paper1.id).toMatch(/^paper_/);
		expect(paper2.id).toMatch(/^paper_/);
	});
});
