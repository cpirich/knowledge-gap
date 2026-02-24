import { NextResponse } from "next/server";
import { deletePaper, getAllPapers } from "@/lib/store/paper-store";
import type { ApiResponse, Paper } from "@/lib/types";

export async function GET(): Promise<NextResponse<ApiResponse<Paper[]>>> {
	const papers = getAllPapers();
	return NextResponse.json({ success: true, data: papers });
}

export async function DELETE(request: Request): Promise<NextResponse<ApiResponse<{ id: string }>>> {
	try {
		const body = await request.json();
		const { id } = body;

		if (!id || typeof id !== "string") {
			return NextResponse.json(
				{ success: false, error: { code: "VALIDATION_ERROR", message: "Missing paper id" } },
				{ status: 400 },
			);
		}

		const deleted = deletePaper(id);
		if (!deleted) {
			return NextResponse.json(
				{ success: false, error: { code: "NOT_FOUND", message: `Paper not found: ${id}` } },
				{ status: 404 },
			);
		}

		return NextResponse.json({ success: true, data: { id } });
	} catch {
		return NextResponse.json(
			{ success: false, error: { code: "INTERNAL_ERROR", message: "Failed to delete paper" } },
			{ status: 500 },
		);
	}
}
