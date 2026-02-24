import { NextResponse } from "next/server";
import { ingestPaper } from "@/lib/ingestion/pipeline";
import type { ApiResponse, Paper } from "@/lib/types";
import { ValidationError } from "@/lib/utils/errors";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request): Promise<NextResponse<ApiResponse<Paper>>> {
	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!file || !(file instanceof File)) {
			throw new ValidationError("No file provided. Send a file in the 'file' field.");
		}

		if (file.size > MAX_FILE_SIZE) {
			throw new ValidationError(
				`File too large. Maximum size is 10MB, got ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
			);
		}

		const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
		const isText = file.type === "text/plain" || file.name.endsWith(".txt");

		if (!isPdf && !isText) {
			throw new ValidationError(
				`Unsupported file type: ${file.type || "unknown"}. Only PDF and TXT files are accepted.`,
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const sourceType = isPdf ? "pdf" : "text";

		const paper = await ingestPaper({
			buffer,
			filename: file.name,
			sourceType,
		});

		return NextResponse.json({ success: true, data: paper });
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		const statusCode = error instanceof ValidationError ? 400 : 500;
		const code = error instanceof ValidationError ? "VALIDATION_ERROR" : "INGESTION_ERROR";

		return NextResponse.json({ success: false, error: { code, message } }, { status: statusCode });
	}
}
