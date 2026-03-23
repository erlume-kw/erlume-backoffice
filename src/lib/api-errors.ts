/**
 * API Error Types
 * 
 * Handles the new centralized validation error format from the backend.
 * All validation errors now return a standardized format with field-level details.
 */

export interface ValidationErrorDetail {
	field: string;
	message: string;
}

export interface ApiErrorResponse {
	success: false;
	error: string;
	code?: string;
	details?: ValidationErrorDetail[];
}

/**
 * Custom error class for API errors with validation details
 */
export class ApiError extends Error {
	public readonly code?: string;
	public readonly details?: ValidationErrorDetail[];
	public readonly statusCode?: number;

	constructor(
		message: string,
		code?: string,
		details?: ValidationErrorDetail[],
		statusCode?: number,
	) {
		super(message);
		this.name = "ApiError";
		this.code = code;
		this.details = details;
		this.statusCode = statusCode;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ApiError);
		}
	}

	/**
	 * Check if this is a validation error with field-level details
	 */
	isValidationError(): boolean {
		return (
			this.code === "VALIDATION_ERROR" ||
			this.code === "INVALID_PARAMS" ||
			this.code === "INVALID_QUERY" ||
			(this.details !== undefined && this.details.length > 0)
		);
	}

	/**
	 * Get error message for a specific field
	 */
	getFieldError(field: string): string | undefined {
		return this.details?.find((detail) => detail.field === field)?.message;
	}

	/**
	 * Get all field errors as a map
	 */
	getFieldErrors(): Record<string, string> {
		if (!this.details) return {};
		const errors: Record<string, string> = {};
		for (const detail of this.details) {
			errors[detail.field] = detail.message;
		}
		return errors;
	}
}
