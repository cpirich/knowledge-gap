import type { Chunk } from "@/lib/types";
import { generateId } from "@/lib/utils/id";

const TARGET_TOKENS = 800;
const OVERLAP_TOKENS = 100;
const CHARS_PER_TOKEN = 4;

const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN;

export function chunkText(text: string, paperId: string): Chunk[] {
	if (!text || text.trim().length === 0) return [];

	const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
	if (paragraphs.length === 0) return [];

	const chunks: Chunk[] = [];
	let currentContent = "";
	let currentStart = 0;
	let chunkIndex = 0;
	let offset = 0;

	for (const paragraph of paragraphs) {
		const paragraphStart = text.indexOf(paragraph, offset);
		if (paragraphStart >= 0) offset = paragraphStart;

		if (currentContent.length > 0 && currentContent.length + paragraph.length > TARGET_CHARS) {
			chunks.push(createChunk(currentContent, currentStart, paperId, chunkIndex));
			chunkIndex++;

			const overlapText = currentContent.slice(-OVERLAP_CHARS);
			currentStart = currentStart + currentContent.length - overlapText.length;
			currentContent = overlapText;
		}

		if (currentContent.length === 0) {
			currentStart = paragraphStart >= 0 ? paragraphStart : offset;
		}
		currentContent += (currentContent.length > 0 ? "\n\n" : "") + paragraph;
	}

	if (currentContent.trim().length > 0) {
		chunks.push(createChunk(currentContent, currentStart, paperId, chunkIndex));
	}

	return chunks;
}

function createChunk(
	content: string,
	startOffset: number,
	paperId: string,
	chunkIndex: number,
): Chunk {
	return {
		id: generateId("chunk"),
		paperId,
		content,
		startOffset,
		endOffset: startOffset + content.length,
		chunkIndex,
		tokenEstimate: Math.ceil(content.length / CHARS_PER_TOKEN),
	};
}
