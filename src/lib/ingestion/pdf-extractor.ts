import { PDFParse } from "pdf-parse";
import { ExtractionError } from "@/lib/utils/errors";

export interface PdfExtractionResult {
	text: string;
	pageCount: number;
}

export async function extractTextFromPdf(buffer: Buffer): Promise<PdfExtractionResult> {
	let parser: PDFParse | null = null;
	try {
		parser = new PDFParse({ data: new Uint8Array(buffer) });
		const result = await parser.getText();

		if (!result.text || result.text.trim().length === 0) {
			throw new ExtractionError("PDF contains no extractable text");
		}

		return {
			text: result.text,
			pageCount: result.total,
		};
	} catch (error) {
		if (error instanceof ExtractionError) throw error;
		throw new ExtractionError(
			`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`,
			{ originalError: error },
		);
	} finally {
		if (parser) {
			await parser.destroy().catch(() => {});
		}
	}
}
