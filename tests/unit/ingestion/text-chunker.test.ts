import { describe, expect, it } from "vitest";
import { chunkText } from "@/lib/ingestion/text-chunker";

describe("chunkText", () => {
	it("returns empty array for empty text", () => {
		expect(chunkText("", "paper1")).toEqual([]);
		expect(chunkText("   ", "paper1")).toEqual([]);
	});

	it("returns single chunk for short text", () => {
		const text = "This is a short paragraph about research findings.";
		const chunks = chunkText(text, "paper1");

		expect(chunks).toHaveLength(1);
		expect(chunks[0].paperId).toBe("paper1");
		expect(chunks[0].content).toContain("short paragraph");
		expect(chunks[0].chunkIndex).toBe(0);
		expect(chunks[0].startOffset).toBe(0);
		expect(chunks[0].tokenEstimate).toBeGreaterThan(0);
		expect(chunks[0].id).toMatch(/^chunk_/);
	});

	it("splits long text into multiple chunks of ~800 tokens", () => {
		// ~800 tokens = ~3200 chars. Create ~5000 words (~25000 chars) of text
		const paragraphs: string[] = [];
		for (let i = 0; i < 30; i++) {
			paragraphs.push(
				`Paragraph ${i}: ${"Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(15)}`,
			);
		}
		const text = paragraphs.join("\n\n");
		const chunks = chunkText(text, "paper1");

		expect(chunks.length).toBeGreaterThan(1);

		// Each chunk should be roughly ~800 tokens (3200 chars), give or take
		for (const chunk of chunks) {
			// Allow up to ~1200 tokens for the last chunk or overlap
			expect(chunk.tokenEstimate).toBeLessThan(1500);
		}
	});

	it("preserves overlap between adjacent chunks", () => {
		const paragraphs: string[] = [];
		for (let i = 0; i < 20; i++) {
			paragraphs.push(
				`Unique paragraph ${i}: ` +
					"Some research content that is meaningful and distinct. ".repeat(12),
			);
		}
		const text = paragraphs.join("\n\n");
		const chunks = chunkText(text, "paper1");

		expect(chunks.length).toBeGreaterThan(1);

		// Check that consecutive chunks have overlapping content
		for (let i = 0; i < chunks.length - 1; i++) {
			const currentEnd = chunks[i].content.slice(-200);
			const nextStart = chunks[i + 1].content.slice(0, 500);
			// The end of one chunk should appear at the start of the next
			const overlap = currentEnd.slice(-100);
			expect(nextStart).toContain(overlap.slice(0, 50));
		}
	});

	it("assigns sequential chunk indices", () => {
		const paragraphs: string[] = [];
		for (let i = 0; i < 20; i++) {
			paragraphs.push(`Paragraph ${i}: ${"Content filler for testing purposes. ".repeat(15)}`);
		}
		const text = paragraphs.join("\n\n");
		const chunks = chunkText(text, "paper1");

		for (let i = 0; i < chunks.length; i++) {
			expect(chunks[i].chunkIndex).toBe(i);
		}
	});

	it("generates unique IDs for each chunk", () => {
		const text = "Para one.\n\nPara two.\n\nPara three.";
		const chunks = chunkText(text, "paper1");
		const ids = chunks.map((c) => c.id);
		const unique = new Set(ids);
		expect(unique.size).toBe(ids.length);
	});

	it("sets paperId correctly on all chunks", () => {
		const text = "Para one.\n\nPara two.";
		const chunks = chunkText(text, "my-paper-id");
		for (const chunk of chunks) {
			expect(chunk.paperId).toBe("my-paper-id");
		}
	});

	it("estimates tokens as chars/4", () => {
		const text = "a".repeat(400); // 400 chars = 100 tokens
		const chunks = chunkText(text, "paper1");
		expect(chunks).toHaveLength(1);
		expect(chunks[0].tokenEstimate).toBe(100);
	});
});
