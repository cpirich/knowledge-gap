import { vi } from "vitest";

export interface MockMessageResponse {
	content: Array<{ type: "text"; text: string }>;
	model: string;
	role: "assistant";
	stop_reason: "end_turn";
	usage: { input_tokens: number; output_tokens: number };
}

export function createMockResponse(jsonData: unknown): MockMessageResponse {
	return {
		content: [{ type: "text", text: JSON.stringify(jsonData) }],
		model: "claude-sonnet-4-20250514",
		role: "assistant",
		stop_reason: "end_turn",
		usage: { input_tokens: 100, output_tokens: 200 },
	};
}

export const mockMessagesCreate = vi.fn<() => Promise<MockMessageResponse>>();

export const mockClient = {
	messages: {
		create: mockMessagesCreate,
	},
};

export function resetMock(): void {
	mockMessagesCreate.mockReset();
}

export function setMockResponse(jsonData: unknown): void {
	mockMessagesCreate.mockResolvedValue(createMockResponse(jsonData));
}
