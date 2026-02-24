// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiResponse, Paper } from "@/lib/types";

// Mock the store to avoid filesystem operations
const papersMap = new Map<string, Paper>();

vi.mock("@/lib/store/paper-store", () => ({
	addPaper: vi.fn((paper: Paper) => {
		papersMap.set(paper.id, paper);
	}),
	updatePaper: vi.fn((id: string, updates: Partial<Paper>) => {
		const existing = papersMap.get(id);
		if (!existing) throw new Error(`Paper not found: ${id}`);
		const updated = { ...existing, ...updates };
		papersMap.set(id, updated);
		return updated;
	}),
	getPaper: vi.fn((id: string) => papersMap.get(id)),
	getAllPapers: vi.fn(() => [...papersMap.values()]),
	deletePaper: vi.fn((id: string) => {
		return papersMap.delete(id);
	}),
	addClaim: vi.fn(),
	getClaimsByPaper: vi.fn(() => []),
}));

import { DELETE, GET } from "@/app/api/papers/route";

function makePaper(id: string, title?: string): Paper {
	return {
		id,
		filename: `${id}.txt`,
		title: title ?? `Paper ${id}`,
		authors: ["Author A"],
		abstract: "Abstract text",
		uploadedAt: new Date().toISOString(),
		sourceType: "text",
		rawText: "Raw text content",
		chunks: [],
		claimIds: [],
		status: "ready",
	};
}

describe("/api/papers", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		papersMap.clear();
	});

	afterEach(() => {
		papersMap.clear();
	});

	describe("GET /api/papers", () => {
		it("returns list of papers when store has papers", async () => {
			const paper1 = makePaper("paper_1", "First Paper");
			const paper2 = makePaper("paper_2", "Second Paper");
			papersMap.set(paper1.id, paper1);
			papersMap.set(paper2.id, paper2);

			const response = await GET();
			const json = (await response.json()) as ApiResponse<Paper[]>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data!).toHaveLength(2);
			expect(json.data![0].title).toBe("First Paper");
			expect(json.data![1].title).toBe("Second Paper");
		});

		it("returns empty array when store is empty", async () => {
			const response = await GET();
			const json = (await response.json()) as ApiResponse<Paper[]>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toBeDefined();
			expect(json.data!).toHaveLength(0);
			expect(json.data!).toEqual([]);
		});
	});

	describe("DELETE /api/papers", () => {
		it("removes a paper by id and returns success", async () => {
			const paper = makePaper("paper_to_delete", "Delete Me");
			papersMap.set(paper.id, paper);

			const request = new Request("http://localhost:3000/api/papers", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: "paper_to_delete" }),
			});

			const response = await DELETE(request);
			const json = (await response.json()) as ApiResponse<{ id: string }>;

			expect(response.status).toBe(200);
			expect(json.success).toBe(true);
			expect(json.data).toEqual({ id: "paper_to_delete" });
		});

		it("returns 404 for non-existent paper id", async () => {
			const request = new Request("http://localhost:3000/api/papers", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id: "nonexistent_id" }),
			});

			const response = await DELETE(request);
			const json = (await response.json()) as ApiResponse<{ id: string }>;

			expect(response.status).toBe(404);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
			expect(json.error!.code).toBe("NOT_FOUND");
			expect(json.error!.message).toContain("Paper not found");
		});

		it("returns 400 when id is missing from body", async () => {
			const request = new Request("http://localhost:3000/api/papers", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({}),
			});

			const response = await DELETE(request);
			const json = (await response.json()) as ApiResponse<{ id: string }>;

			expect(response.status).toBe(400);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
			expect(json.error!.code).toBe("VALIDATION_ERROR");
			expect(json.error!.message).toContain("Missing paper id");
		});

		it("returns 500 when body is not valid JSON", async () => {
			const request = new Request("http://localhost:3000/api/papers", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: "not valid json",
			});

			const response = await DELETE(request);
			const json = (await response.json()) as ApiResponse<{ id: string }>;

			expect(response.status).toBe(500);
			expect(json.success).toBe(false);
			expect(json.error).toBeDefined();
			expect(json.error!.code).toBe("INTERNAL_ERROR");
		});
	});
});
