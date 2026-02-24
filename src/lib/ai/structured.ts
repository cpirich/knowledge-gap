import type { ZodType } from "zod";
import { getClient } from "./client";

const MODEL = "claude-sonnet-4-20250514";
const MAX_RETRIES = 3;

export interface ExtractStructuredOptions<T> {
	prompt: string;
	schema: ZodType<T>;
	systemPrompt?: string;
}

export async function extractStructured<T>(options: ExtractStructuredOptions<T>): Promise<T> {
	const client = getClient();
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
		try {
			const response = await client.messages.create({
				model: MODEL,
				max_tokens: 4096,
				...(options.systemPrompt ? { system: options.systemPrompt } : {}),
				messages: [{ role: "user", content: options.prompt }],
			});

			const textBlock = response.content.find((block) => block.type === "text");
			if (!textBlock || textBlock.type !== "text") {
				throw new Error("No text content in response");
			}

			const raw = textBlock.text.trim();
			const jsonMatch = raw.match(/\{[\s\S]*\}/) || raw.match(/\[[\s\S]*\]/);
			if (!jsonMatch) {
				throw new Error("No JSON found in response");
			}

			const parsed = JSON.parse(jsonMatch[0]);
			return options.schema.parse(parsed);
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			if (attempt < MAX_RETRIES - 1) {
				await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
			}
		}
	}

	throw lastError ?? new Error("extractStructured failed after retries");
}
