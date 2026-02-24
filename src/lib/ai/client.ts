import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
	if (client) return client;

	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error(
			"ANTHROPIC_API_KEY environment variable is required. Set it in your .env.local file.",
		);
	}

	client = new Anthropic({ apiKey });
	return client;
}
