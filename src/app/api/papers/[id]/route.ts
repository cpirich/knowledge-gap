import { NextResponse } from "next/server";
import { deletePaper, getPaper } from "@/lib/store/paper-store";
import type { ApiResponse, Paper } from "@/lib/types";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<Paper>>> {
	const { id } = await params;
	const paper = getPaper(id);
	if (!paper) {
		return NextResponse.json(
			{ success: false, error: { code: "NOT_FOUND", message: `Paper not found: ${id}` } },
			{ status: 404 },
		);
	}
	return NextResponse.json({ success: true, data: paper });
}

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<{ id: string }>>> {
	const { id } = await params;
	const deleted = deletePaper(id);
	if (!deleted) {
		return NextResponse.json(
			{ success: false, error: { code: "NOT_FOUND", message: `Paper not found: ${id}` } },
			{ status: 404 },
		);
	}
	return NextResponse.json({ success: true, data: { id } });
}
