import { ApiError } from "@/infrastructure/http/api";

export type SignInErrorKind =
  | "invalidCredentials"
  | "accountSuspended"
  | "tooManyAttempts"
  | "serverError"
  | null;

export function isInvalidSignInError(error: unknown) {
  return error instanceof ApiError && error.status === 401;
}

export function classifySignInError(error: unknown): SignInErrorKind {
  if (!(error instanceof ApiError)) return error ? "serverError" : null;
  if (error.status === 401) return "invalidCredentials";
  if (error.status === 403) return "accountSuspended";
  if (error.status === 429) return "tooManyAttempts";
  return "serverError";
}
