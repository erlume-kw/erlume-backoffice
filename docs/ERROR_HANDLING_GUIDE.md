# Error Handling Guide

This guide explains how to handle API errors in the frontend/backoffice, especially the new validation error format with field-level details.

## Overview

The backend now returns validation errors in a standardized format with field-level details. The frontend has been updated to handle these errors gracefully.

## Error Format

All validation errors from the backend follow this structure:

```typescript
{
  success: false;
  error: string;           // General error message
  code?: string;           // Error code (e.g., "VALIDATION_ERROR")
  details?: Array<{        // Field-level errors
    field: string;         // Field name (e.g., "emailAddress")
    message: string;       // Specific error message
  }>;
}
```

## Using the Error Utilities

### Basic Error Handling

The easiest way to handle errors is using the `formatApiError` utility:

```typescript
import { formatApiError } from "@/lib/error-utils";

try {
  await restApi.users.create(userData);
} catch (err) {
  const errorMessage = formatApiError(err);
  setFormError(errorMessage);
}
```

This will automatically:
- Extract field-level errors and format them
- Fall back to the general error message if no field errors
- Handle both new `ApiError` and legacy `Error` types

### Field-Level Error Handling

For more control, you can use the `ApiError` class directly:

```typescript
import { ApiError } from "@/lib/rest-client";
import { getFieldErrors, getFieldError } from "@/lib/error-utils";

try {
  await restApi.users.create(userData);
} catch (err) {
  if (err instanceof ApiError && err.isValidationError()) {
    // Get all field errors as a map
    const fieldErrors = err.getFieldErrors();
    // { emailAddress: "Invalid email address", phoneNumber: "Invalid phone number" }
    
    // Or get error for a specific field
    const emailError = err.getFieldError("emailAddress");
    
    // Display errors next to form fields
    setFieldError("emailAddress", emailError || "");
  } else {
    setFormError(formatApiError(err));
  }
}
```

### Using Error Utilities

```typescript
import { formatApiError, getFieldErrors, getFieldError } from "@/lib/error-utils";

try {
  await restApi.items.create(itemData);
} catch (err) {
  // Format for general display
  const message = formatApiError(err);
  setFormError(message);
  
  // Or get field-specific errors
  const fieldErrors = getFieldErrors(err);
  const nameError = getFieldError(err, "name");
}
```

## Examples

### Example 1: Simple Form Error Display

```typescript
const [formError, setFormError] = useState<string | null>(null);

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setFormError(null);
  
  try {
    await restApi.expenses.create(expenseData);
    // Success handling...
  } catch (err) {
    setFormError(formatApiError(err) || "Failed to save expense");
  }
};

// In JSX:
{formError && (
  <div className="text-sm text-destructive">{formError}</div>
)}
```

### Example 2: Field-Level Error Display

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
const [formError, setFormError] = useState<string | null>(null);

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setFieldErrors({});
  setFormError(null);
  
  try {
    await restApi.users.create(userData);
    // Success handling...
  } catch (err) {
    if (err instanceof ApiError && err.isValidationError()) {
      const errors = err.getFieldErrors();
      setFieldErrors(errors);
      
      // Also show general message if no field errors
      if (Object.keys(errors).length === 0) {
        setFormError(err.message);
      }
    } else {
      setFormError(formatApiError(err));
    }
  }
};

// In JSX:
<Input
  name="emailAddress"
  className={fieldErrors.emailAddress ? "border-destructive" : ""}
/>
{fieldErrors.emailAddress && (
  <div className="text-sm text-destructive mt-1">
    {fieldErrors.emailAddress}
  </div>
)}
```

### Example 3: Using in useResourceList Hook

The `useResourceList` hook automatically handles errors:

```typescript
const { data, loading, error, reload } = useResourceList(
  () => restApi.items.getAll()
);

// error will be automatically formatted with field-level details
if (error) {
  return <div>Error: {error}</div>;
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Request body validation failed | 400 |
| `INVALID_PARAMS` | Route parameter validation failed (e.g., invalid ID) | 400 |
| `INVALID_QUERY` | Query parameter validation failed | 400 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

## Migration Guide

### Before (Old Code)

```typescript
try {
  await restApi.users.create(userData);
} catch (err) {
  const message = err instanceof Error ? err.message : "Failed to save user";
  setFormError(message);
}
```

### After (New Code)

```typescript
import { formatApiError } from "@/lib/error-utils";

try {
  await restApi.users.create(userData);
} catch (err) {
  setFormError(formatApiError(err) || "Failed to save user");
}
```

## API Reference

### `ApiError` Class

```typescript
class ApiError extends Error {
  code?: string;              // Error code
  details?: ValidationErrorDetail[];  // Field-level errors
  statusCode?: number;        // HTTP status code
  
  isValidationError(): boolean;
  getFieldError(field: string): string | undefined;
  getFieldErrors(): Record<string, string>;
}
```

### Error Utilities

```typescript
// Format any error into a user-friendly message
formatApiError(err: unknown): string

// Get all field errors as a map
getFieldErrors(err: unknown): Record<string, string>

// Get error for a specific field
getFieldError(err: unknown, field: string): string | undefined
```

## Best Practices

1. **Always use `formatApiError`** for simple error display
2. **Use field-level errors** when you want to show errors next to specific form fields
3. **Check `isValidationError()`** before accessing field errors
4. **Provide fallback messages** for non-API errors
5. **Log errors** for debugging: `console.error("Operation failed", err)`

## Files Updated

- `src/lib/api-errors.ts` - Error types and `ApiError` class
- `src/lib/rest-client.ts` - Updated to parse and throw `ApiError`
- `src/lib/error-utils.ts` - Utility functions for error handling
- `src/hooks/use-resource-list.ts` - Updated to use new error format
- `src/pages/UsersPage.tsx` - Example implementation
- `src/pages/ItemsPage.tsx` - Example implementation
- `src/pages/ExpensesPage.tsx` - Example implementation

## Testing

When testing error handling:

1. **Test invalid data** - You'll get field-level error messages
2. **Test missing fields** - Each missing field will be listed separately
3. **Test invalid formats** - Specific format errors for each field

Example test cases:
- Invalid email: `{ emailAddress: "not-an-email" }`
- Invalid ObjectId: `GET /api/items/invalid-id`
- Missing required fields: `{ user_id: "..." }` (missing `order_status`)
