/**
 * Auth token transport DTOs — the shape the backend returns from token-issuing
 * routes and the shape the `infrastructure/auth-transport` layer reads when it
 * sets the HttpOnly cookies. Kept in `common/` so infrastructure does not import
 * up into `features/auth`; `features/auth/types/sign-in.types` re-exports them
 * for the auth feature's own consumers.
 */
export type AuthTokens = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type AuthTokensResponse = { data: AuthTokens; meta: Record<string, unknown> };
