import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

/**
 * Normalizes axios errors into something the UI can show:
 * a message plus optional per-field errors from the API's 422 body.
 */
export function describeError(err: unknown): {
  message: string;
  fieldErrors?: Record<string, string>;
} {
  if (isAxiosError(err)) {
    const api = err.response?.data as ApiErrorResponse | undefined;
    if (api && api.errors) {
      const fieldErrors: Record<string, string> = {};
      for (const [field, messages] of Object.entries(api.errors)) {
        if (messages.length > 0) fieldErrors[field] = messages[0];
      }
      return { message: api.message, fieldErrors };
    }
    return { message: err.response?.data?.message ?? err.message };
  }
  return { message: err instanceof Error ? err.message : "Something went wrong." };
}
