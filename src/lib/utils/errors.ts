export class AppError extends Error {
	constructor(
		message: string,
		public code: string,
		public statusCode: number = 500,
		public details?: unknown,
	) {
		super(message);
		this.name = "AppError";
	}
}

export class ExtractionError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "EXTRACTION_ERROR", 500, details);
		this.name = "ExtractionError";
	}
}

export class ClaimExtractionError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "CLAIM_EXTRACTION_ERROR", 500, details);
		this.name = "ClaimExtractionError";
	}
}

export class AnalysisError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "ANALYSIS_ERROR", 500, details);
		this.name = "AnalysisError";
	}
}

export class ValidationError extends AppError {
	constructor(message: string, details?: unknown) {
		super(message, "VALIDATION_ERROR", 400, details);
		this.name = "ValidationError";
	}
}
