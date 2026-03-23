/**
 * Error handling utilities for API errors
 * 
 * Provides helper functions to format and display API errors,
 * especially validation errors with field-level details.
 */

import { ApiError } from "./api-errors";

/**
 * Format an API error into a user-friendly message
 * 
 * @param err - The error to format (can be ApiError, Error, or unknown)
 * @returns A formatted error message string
 */
export function formatApiError(err: unknown): string {
	if (err instanceof ApiError) {
		if (err.isValidationError()) {
			const fieldErrors = err.getFieldErrors();
			if (Object.keys(fieldErrors).length > 0) {
				// Format field errors: "field1: message1; field2: message2"
				const errorMessages = Object.entries(fieldErrors).map(
					([field, message]) => `${field}: ${message}`,
				);
				return errorMessages.join("; ");
			}
		}
		return err.message;
	}

	if (err instanceof Error) {
		return err.message;
	}

	return "An unexpected error occurred";
}

/**
 * Get field-level errors from an API error
 * 
 * @param err - The error to extract field errors from
 * @returns A map of field names to error messages, or empty object if not a validation error
 */
export function getFieldErrors(err: unknown): Record<string, string> {
	if (err instanceof ApiError && err.isValidationError()) {
		return err.getFieldErrors();
	}
	return {};
}

/**
 * Get error message for a specific field
 * 
 * @param err - The error to check
 * @param field - The field name to get the error for
 * @returns The error message for the field, or undefined if not found
 */
export function getFieldError(err: unknown, field: string): string | undefined {
	if (err instanceof ApiError && err.isValidationError()) {
		return err.getFieldError(field);
	}
	return undefined;
}
