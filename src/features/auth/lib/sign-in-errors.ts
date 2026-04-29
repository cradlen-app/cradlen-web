import { ApiError } from "@/lib/api";

export function isInvalidSignInError(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}
