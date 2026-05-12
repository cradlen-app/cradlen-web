import { ApiError } from "./api";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    return error.messages[0] ?? fallback;
  }
  return fallback;
}
