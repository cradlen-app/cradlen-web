/**
 * Auth cookie/token transport constants.
 *
 * These name the HttpOnly cookies the Next route handlers own and the lifetimes
 * the refresh/silent-refresh machinery schedules against. They live in
 * `common/` (which imports nothing else in `src/`) so the `infrastructure/`
 * auth-transport layer and the root `proxy.ts` guard can read them without
 * importing up into `features/auth`. `features/auth/lib/auth.constants` re-exports
 * them for the auth feature's own consumers.
 */

export const AUTH_TOKEN_COOKIE = "cradlen-auth-token";
export const AUTH_REFRESH_TOKEN_COOKIE = "cradlen-refresh-token";
export const AUTH_SELECTION_TOKEN_COOKIE = "cradlen-selection-token";
export const SIGNUP_TOKEN_COOKIE = "cradlen-signup-token";
export const RESET_TOKEN_COOKIE = "cradlen-reset-token";

// Matches the backend refresh-token JWT lifetime (JWT_REFRESH_EXPIRATION, 7d).
// setAuthCookies re-sets this cookie on every rotation, so the 7-day window
// slides on each use: active within any 7-day window = never logged out;
// 7 full days idle = clean logout (no dead-cookie 401 dance past the JWT exp).
export const AUTH_REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;
export const DEFAULT_AUTH_EXPIRES_IN = 60 * 60;
// Bootstrap value for proactive silent refresh: matches the backend access-token
// TTL (JWT_ACCESS_EXPIRATION, 15m). Only used to schedule the FIRST refresh
// before any /auth/refresh response is seen; subsequent ticks use the live
// `expires_in` returned by the refresh route. Overridable via
// NEXT_PUBLIC_ACCESS_TOKEN_TTL_SECONDS so it can track the backend without a
// code change (and so a short value can be used to verify the flow locally).
export const ACCESS_TOKEN_TTL_SECONDS =
  Number(process.env.NEXT_PUBLIC_ACCESS_TOKEN_TTL_SECONDS) || 60 * 15;
// Fraction of the access-token lifetime at which to proactively refresh, leaving
// margin for clock skew and background-tab timer throttling.
export const SILENT_REFRESH_RATIO = 0.8;
export const AUTH_SELECTION_TOKEN_MAX_AGE = 60 * 30;
export const SIGNUP_TOKEN_MAX_AGE = 60 * 10;
export const RESET_TOKEN_MAX_AGE = 60 * 30;
