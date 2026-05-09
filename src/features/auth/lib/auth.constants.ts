export const STAFF_ROLE = {
  OWNER: "owner",
  DOCTOR: "doctor",
  RECEPTION: "reception",
  UNKNOWN: "unknown",
} as const;

export type StaffRole = (typeof STAFF_ROLE)[keyof typeof STAFF_ROLE];

export const AUTH_TOKEN_COOKIE = "cradlen-auth-token";
export const AUTH_REFRESH_TOKEN_COOKIE = "cradlen-refresh-token";
export const AUTH_SELECTION_TOKEN_COOKIE = "cradlen-selection-token";
export const SIGNUP_TOKEN_COOKIE = "cradlen-signup-token";
export const RESET_TOKEN_COOKIE = "cradlen-reset-token";
export const AUTH_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;
export const DEFAULT_AUTH_EXPIRES_IN = 60 * 60;
export const AUTH_SELECTION_TOKEN_MAX_AGE = 60 * 30;
export const SIGNUP_TOKEN_MAX_AGE = 60 * 10;
export const RESET_TOKEN_MAX_AGE = 60 * 30;
