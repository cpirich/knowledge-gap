import { z } from "zod";
import { metadataExtractionPrompt } from "@/lib/ai/prompts";
import { extractStructured } from "@/lib/ai/structured";
import { addClaim, addPaper, updatePaper } from "@/lib/store/paper-store";
import type { Claim, Paper } from "@/lib/types";
import { ExtractionError } from "@/lib/utils/errors";
import { generateId } from "@/lib/utils/id";
import { extractClaims } from "./claim-extractor";
import { extractTextFromPdf } from "./pdf-extractor";
import { chunkText } from "./text-chunker";

const metadataSchema = z.object({
	title: z.string(),
	authors: z.array(z.string()),
	abstract: z.string(),
});

const BATCH_SIZE = 3;

export interface IngestPaperOptions {
	buffer: Buffer;
	filename: string;
	sourceType: "pdf" | "text";
}

export async function ingestPaper(options: IngestPaperOptions): Promise<Paper> {
	const paperId = generateId("paper");
	const now = new Date().toISOString();

	let paper: Paper = {
		id: paperId,
		filename: options.filename,
		title: options.filename,
		authors: [],
		abstract: "",
		uploadedAt: now,
		sourceType: options.sourceType,
		rawText: "",
		chunks: [],
		claimIds: [],
		status: "uploading",
	};

	addPaper(paper);

	try {
		// Extract text
		paper = updatePaper(paperId, { status: "extracting_text" });

		let rawText: string;
		if (options.sourceType === "pdf") {
			const result = await extractTextFromPdf(options.buffer);
			rawText = result.text;
		} else {
			rawText = options.buffer.toString("utf-8");
			if (!rawText.trim()) {
				throw new ExtractionError("Text file is empty");
			}
		}

		paper = updatePaper(paperId, { rawText });

		// Extract metadata via Claude
		const metadata = await extractStructured({
			prompt: metadataExtractionPrompt(rawText),
			schema: metadataSchema,
			systemPrompt:
				"You are an expert at parsing academic papers. Extract metadata precisely. Return valid JSON only.",
		});

		paper = updatePaper(paperId, {
			title: metadata.title,
			authors: metadata.authors,
			abstract: metadata.abstract,
		});

		// Chunk text
		paper = updatePaper(paperId, { status: "chunking" });
		const chunks = chunkText(rawText, paperId);
		paper = updatePaper(paperId, { chunks });

		// Extract claims in parallel batches
		paper = updatePaper(paperId, { status: "extracting_claims" });
		const allClaims: Claim[] = [];

		for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
			const batch = chunks.slice(i, i + BATCH_SIZE);
			const batchResults = await Promise.all(
				batch.map((chunk) =>
					extractClaims(chunk, {
						title: paper.title,
						authors: paper.authors,
					}),
				),
			);
			for (const claims of batchResults) {
				for (const claim of claims) {
					addClaim(claim);
					allClaims.push(claim);
				}
			}
		}

		paper = updatePaper(paperId, {
			claimIds: allClaims.map((c) => c.id),
			status: "ready",
		});

		return paper;
	} catch (error) {
		paper = updatePaper(paperId, { status: "error" });
		throw error;
	}
}
