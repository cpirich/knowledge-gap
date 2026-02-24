// @vitest-environment node
import * as fs from "node:fs";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse, Paper } from "@/lib/types";

// Mock the AI client
vi.mock("@/lib/ai/client", () => ({
	getClient: vi.fn(() => ({
		messages: { create: vi.fn() },
	})),
}));

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
	const claims = new Map<string, unknown>();
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
		getAllPapers: vi.fn(() => [...papers.values()]),
		deletePaper: vi.fn((id: string) => papers.delete(id)),
		addClaim: vi.fn((claim: { id: string }) => {
			claims.set(claim.id, claim);
		}),
		getClaimsByPaper: vi.fn(() => []),
		_reset: () => {
			papers.clear();
			claims.clear();
		},
	};
});

// Mock pdf-parse
vi.mock("pdf-parse", () => {
	class MockPDFParse {
		async getText() {
			return {
				text: "Sample extracted PDF text.\n\nThis is the second paragraph.",
				total: 1,
				pages: [],
			};
		}
		async destroy() {}
	}
	return { PDFParse: MockPDFParse };
});

import { POST } from "@/app/api/ingest/route";
import { extractStructured } from "@/lib/ai/structured";
import { extractClaims } from "@/lib/ingestion/claim-extractor";
import * as paperStore from "@/lib/store/paper-store";

const mockExtractStructured = vi.mocked(extractStructured);
const mockExtractClaims = vi.mocked(extractClaims);

function createFileRequest(filename: string, content: string, type?: string): Request {
	const blob = new Blob([content], { type: type ?? "text/plain" });
	const file = new File([blob], filename, { type: type ?? "text/plain" });
	const formData = new FormData();
	formData.set("file", file);
	return new Request("http://localhost:3000/api/ingest", {
		method: "POST",
		body: formData,
	});
}

describe("POST /api/ingest", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(paperStore as unknown as { _reset: () => void })._reset();

		// Default metadata response
		mockExtractStructured.mockResolvedValue({
			title: "Sleep-Dependent Memory Consolidation",
			authors: ["Sarah J. Chen", "Michael R. Torres"],
			abstract: "Memory consolidation during sleep is critical.",
		});

		// Default claims response
		mockExtractClaims.mockResolvedValue([
			{
				id: "claim_test_1",
				paperId: "paper_test_1",
				chunkId: "chunk_test_1",
				type: "finding",
				statement: "SWS deprivation impairs declarative memory",
				evidence: "Meta-analysis of 47 studies",
				confidence: "high",
				themeIds: [],
				metadata: {},
			},
		]);
	});

	afterEach(() => {
		(paperStore as unknown as { _reset: () => void })._reset();
	});

	it("returns 200 with Paper for valid text file upload", async () => {
		const sampleText = fs.readFileSync(
			path.join(process.cwd(), "tests/fixtures/sample-text.txt"),
			"utf-8",
		);
		const request = createFileRequest("paper.txt", sampleText);

		const response = await POST(request);
		const json = (await response.json()) as ApiResponse<Paper>;

		expect(response.status).toBe(200);
		expect(json.success).toBe(true);
		expect(json.data).toBeDefined();
		expect(json.data!.status).toBe("ready");
		expect(json.data!.title).toBe("Sleep-Dependent Memory Consolidation");
		expect(json.data!.authors).toEqual(["Sarah J. Chen", "Michael R. Torres"]);
		expect(json.data!.sourceType).toBe("text");
		expect(json.data!.filename).toBe("paper.txt");
		expect(json.data!.id).toMatch(/^paper_/);
		expect(json.data!.rawText).toContain("Sleep-Dependent Memory Consolidation");
		expect(json.data!.chunks.length).toBeGreaterThan(0);
		expect(json.data!.claimIds.length).toBeGreaterThan(0);
	});

	it("returns 400 for invalid file type (e.g., .jpg)", async () => {
		const request = createFileRequest("photo.jpg", "fake image data", "image/jpeg");

		const response = await POST(request);
		const json = (await response.json()) as ApiResponse<Paper>;

		expect(response.status).toBe(400);
		expect(json.success).toBe(false);
		expect(json.error).toBeDefined();
		expect(json.error!.code).toBe("VALIDATION_ERROR");
		expect(json.error!.message).toContain("Unsupported file type");
	});

	it("returns 400 for oversized file (>10MB)", async () => {
		// Create a buffer larger than 10MB
		const largeContent = "x".repeat(11 * 1024 * 1024);
		const request = createFileRequest("huge.txt", largeContent);

		const response = await POST(request);
		const json = (await response.json()) as ApiResponse<Paper>;

		expect(response.status).toBe(400);
		expect(json.success).toBe(false);
		expect(json.error).toBeDefined();
		expect(json.error!.code).toBe("VALIDATION_ERROR");
		expect(json.error!.message).toContain("File too large");
	});

	it("returns 400 for empty body (no file)", async () => {
		const formData = new FormData();
		const request = new Request("http://localhost:3000/api/ingest", {
			method: "POST",
			body: formData,
		});

		const response = await POST(request);
		const json = (await response.json()) as ApiResponse<Paper>;

		expect(response.status).toBe(400);
		expect(json.success).toBe(false);
		expect(json.error).toBeDefined();
		expect(json.error!.code).toBe("VALIDATION_ERROR");
		expect(json.error!.message).toContain("No file provided");
	});
});
