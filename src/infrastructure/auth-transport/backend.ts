import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isExpiredJwt } from "./jwt";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_MAX_AGE,
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_MAX_AGE,
  AUTH_TOKEN_COOKIE,
  DEFAULT_AUTH_EXPIRES_IN,
  RESET_TOKEN_COOKIE,
  RESET_TOKEN_MAX_AGE,
  SIGNUP_TOKEN_COOKIE,
  SIGNUP_TOKEN_MAX_AGE,
} from "@/common/constants/auth-cookies";
import type {
  AuthTokens,
  AuthTokensResponse,
} from "@/common/types/auth-tokens.types";

/**
 * Resolves the backend base URL and, in production, refuses an untrusted target.
 * Staff access/refresh tokens are attached to every backend call, so a tampered
 * `API_BASE_URL` would exfiltrate them to an attacker origin. We fail closed at
 * module load rather than silently leak. Non-production stays permissive
 * (localhost / test backends over http are fine).
 */
function resolveApiBaseUrl(): string {
  const raw = (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://api.cradlen.com/v1"
  ).replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      throw new Error(`Invalid API base URL: ${raw}`);
    }
    if (url.protocol !== "https:") {
      throw new Error(`API base URL must use https in production (got ${raw})`);
    }
    if (url.hostname !== "cradlen.com" && !url.hostname.endsWith(".cradlen.com")) {
      throw new Error(
        `Refusing untrusted API base host in production: ${url.hostname}`,
      );
    }
  }

  return raw;
}

export const API_BASE_URL = resolveApiBaseUrl();

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export class BackendError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(`Backend request failed with status ${status}`);
  }
}

/**
 * Joins a backend-relative path to {@link API_BASE_URL}. Rejects paths that could
 * escape the API origin or traverse out of the intended endpoint:
 *  - protocol-relative (`//evil.com`) or scheme-smuggling (`/https://…`) targets
 *  - `..` path segments
 * The query string (after `?`) is left untouched. This is the gateway guard for
 * the `/api/backend/[...path]` catch-all proxy, where dynamic segments flow in.
 */
export function backendUrl(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const [pathname] = normalized.split("?");

  const unsafe =
    pathname.startsWith("//") ||
    /^\/[a-z][a-z0-9+.-]*:/i.test(pathname) ||
    pathname.split("/").includes("..");

  if (unsafe) {
    throw new Error(`Unsafe backend path rejected: ${pathname}`);
  }

  return `${API_BASE_URL}${normalized}`;
}

// Re-exported (imported above) from the shared, dependency-free helper so existing
// `@/infrastructure/auth-transport/backend` importers keep working while the
// implementation (and clock-skew leeway) lives in one place.
export { isExpiredJwt };

export function extractTokens(body: unknown): AuthTokens | null {
  if (!body || typeof body !== "object") return null;

  const maybeWrapped = body as { data?: unknown };
  const tokenSource =
    maybeWrapped.data && typeof maybeWrapped.data === "object"
      ? maybeWrapped.data
      : body;
  const maybeTokens = tokenSource as Partial<AuthTokens>;

  if (
    typeof maybeTokens.access_token !== "string" ||
    typeof maybeTokens.refresh_token !== "string"
  ) {
    return null;
  }

  return {
    access_token: maybeTokens.access_token,
    refresh_token: maybeTokens.refresh_token,
    token_type: maybeTokens.token_type ?? "Bearer",
    expires_in: maybeTokens.expires_in ?? DEFAULT_AUTH_EXPIRES_IN,
  };
}

export async function backendFetch(path: string, init?: RequestInit) {
  return fetch(backendUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
}

export async function readBackendJson(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

/**
 * Strips internal detail out of a backend error before it is forwarded to the
 * browser. 5xx bodies are collapsed to a generic message (they can carry stack
 * traces / internal paths); 4xx bodies surface only a user-facing `message` and
 * an optional `{ field, message }[]` validation list that the forms rely on.
 * Anything else (internal keys, raw text) is dropped. Always log the full body
 * server-side before calling this.
 */
export function sanitizeBackendError(
  body: unknown,
  status: number,
): Record<string, unknown> {
  if (status >= 500) {
    return { message: "Something went wrong. Please try again." };
  }

  const fallback = "Request failed.";
  if (!body || typeof body !== "object") return { message: fallback };

  const b = body as Record<string, unknown>;
  const out: Record<string, unknown> = {};

  if (typeof b.message === "string") {
    out.message = b.message;
  } else if (typeof b.detail === "string") {
    out.message = b.detail;
  } else if (
    b.error &&
    typeof (b.error as Record<string, unknown>).message === "string"
  ) {
    out.message = (b.error as Record<string, unknown>).message;
  }

  if (Array.isArray(b.errors)) {
    out.errors = b.errors
      .filter(
        (e): e is Record<string, unknown> =>
          Boolean(e) && typeof e === "object",
      )
      .map((e) => ({
        ...(typeof e.field === "string" ? { field: e.field } : {}),
        ...(typeof e.message === "string" ? { message: e.message } : {}),
      }));
  }

  if (out.message === undefined && out.errors === undefined) {
    out.message = fallback;
  }

  return out;
}

export function setAuthCookies(response: NextResponse, tokens: AuthTokens) {
  response.cookies.set(AUTH_TOKEN_COOKIE, tokens.access_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, tokens.expires_in),
  });
  response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: AUTH_REFRESH_TOKEN_MAX_AGE,
  });
}

export function setSelectionTokenCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_SELECTION_TOKEN_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: AUTH_SELECTION_TOKEN_MAX_AGE,
  });
}

export function setSignupTokenCookie(
  response: NextResponse,
  token: string,
  maxAge = SIGNUP_TOKEN_MAX_AGE,
) {
  response.cookies.set(SIGNUP_TOKEN_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, maxAge),
  });
}

export function clearSelectionTokenCookie(response: NextResponse) {
  response.cookies.set(AUTH_SELECTION_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export function clearSignupTokenCookie(response: NextResponse) {
  response.cookies.set(SIGNUP_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export function setResetTokenCookie(
  response: NextResponse,
  token: string,
  maxAge = RESET_TOKEN_MAX_AGE,
) {
  response.cookies.set(RESET_TOKEN_COOKIE, token, {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: Math.max(0, maxAge),
  });
}

export function clearResetTokenCookie(response: NextResponse) {
  response.cookies.set(RESET_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
}

export function getResetTokenFromRequest(req: NextRequest): string | null {
  return req.cookies.get(RESET_TOKEN_COOKIE)?.value ?? null;
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  clearSelectionTokenCookie(response);
  clearSignupTokenCookie(response);
}

export function sessionResponse(
  body: unknown,
  tokens: AuthTokens | null,
  status = 200,
) {
  const response = NextResponse.json(body, { status });

  if (tokens) {
    setAuthCookies(response, tokens);
  }

  return response;
}

export async function proxySessionEndpoint(
  path: string,
  request: Request,
  sanitize: (body: unknown) => unknown = () => ({
    data: { authenticated: true },
    meta: {},
  }),
) {
  const requestBody = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();
  const response = await backendFetch(path, {
    method: request.method,
    body: requestBody,
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    if (response.status >= 500) {
      console.error("[auth-transport] backend error", response.status, body);
    }
    return NextResponse.json(sanitizeBackendError(body, response.status), {
      status: response.status,
    });
  }

  const tokens = extractTokens(body);
  return sessionResponse(tokens ? sanitize(body) : body, tokens, response.status);
}

const inflightRefreshes = new Map<string, Promise<AuthTokens>>();

async function performRefresh(refreshToken: string) {
  const response = await backendFetch("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await readBackendJson(response);

  if (!response.ok) {
    throw new BackendError(response.status, body);
  }

  const tokens = extractTokens(body as AuthTokensResponse);
  if (!tokens) {
    throw new BackendError(response.status, body);
  }

  return tokens;
}

// Exported so the proactive `/api/auth/refresh` route shares this same in-flight
// dedup as the reactive proxy path — a proactive refresh racing a reactive one
// then collapses into a single backend rotation instead of double-rotating.
export async function refreshAuthTokens(refreshToken: string) {
  const existing = inflightRefreshes.get(refreshToken);
  if (existing) return existing;

  const promise = performRefresh(refreshToken).finally(() => {
    inflightRefreshes.delete(refreshToken);
  });
  inflightRefreshes.set(refreshToken, promise);
  return promise;
}

async function getValidAccessToken() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && !isExpiredJwt(accessToken)) {
    return { accessToken, refreshedTokens: null };
  }

  if (!refreshToken) {
    return { accessToken: null, refreshedTokens: null };
  }

  try {
    const refreshedTokens = await refreshAuthTokens(refreshToken);
    return { accessToken: refreshedTokens.access_token, refreshedTokens };
  } catch {
    // Proactive refresh failed (rotated/stale refresh token, refresh race, or a
    // backend blip). Degrade to "no token" so the caller falls through to the
    // selection-token fallback instead of dead-ending on a generic
    // "Authentication required" 401 — mirroring the reactive 401 path's recovery.
    return { accessToken: null, refreshedTokens: null };
  }
}

// Last-resort recovery when refresh fails but the selection_token is still
// within its 30-min TTL. Mints a fresh token pair without bouncing the user
// back through /sign-in. Per backend contract: if the user has only one
// branch this also re-creates the active branch context.
async function fallbackToSelectionToken(
  request: NextRequest,
): Promise<AuthTokens | null> {
  const cookieStore = await cookies();
  const selectionToken = cookieStore.get(AUTH_SELECTION_TOKEN_COOKIE)?.value;
  if (!selectionToken) return null;

  const profileId = request.headers.get("x-profile-id");
  if (!profileId) return null;
  const branchId = request.headers.get("x-branch-id");

  try {
    const response = await fetch(backendUrl("/auth/profiles/select"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selection_token: selectionToken,
        profile_id: profileId,
        ...(branchId ? { branch_id: branchId } : {}),
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as unknown;
    return extractTokens(body);
  } catch {
    return null;
  }
}

function copyRequestHeaders(request: NextRequest, accessToken: string) {
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  const organizationId = request.headers.get("x-organization-id");
  const profileId = request.headers.get("x-profile-id");
  const branchId = request.headers.get("x-branch-id");

  if (organizationId) headers.set("X-Organization-Id", organizationId);
  if (profileId) headers.set("X-Profile-Id", profileId);
  if (branchId) headers.set("X-Branch-Id", branchId);

  headers.delete("host");
  headers.delete("cookie");
  headers.delete("content-length");

  if (!headers.has("Content-Type") && request.method !== "GET") {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function proxyAuthenticatedRequest(
  request: NextRequest,
  backendPath: string,
) {
  let refreshedTokens: AuthTokens | null = null;
  const requestBody = ["GET", "HEAD"].includes(request.method)
    ? undefined
    : await request.arrayBuffer();

  try {
    const validToken = await getValidAccessToken();
    refreshedTokens = validToken.refreshedTokens;

    if (!validToken.accessToken) {
      const fallback = await fallbackToSelectionToken(request);
      if (!fallback) {
        // Do NOT clear cookies here: a sibling request racing the same refresh
        // may have just rotated and set fresh cookies, and wiping them would log
        // the whole session out over a recoverable race. Expired cookies fail
        // closed on their own; the client redirects once on the 401.
        return NextResponse.json(
          { message: "Authentication required" },
          { status: 401 },
        );
      }
      refreshedTokens = fallback;
      const retryResponse = await fetch(backendUrl(backendPath), {
        method: request.method,
        headers: copyRequestHeaders(request, fallback.access_token),
        body: requestBody,
      });
      return forwardBackendResponse(retryResponse, refreshedTokens);
    }

    const response = await fetch(backendUrl(backendPath), {
      method: request.method,
      headers: copyRequestHeaders(request, validToken.accessToken),
      body: requestBody,
    });

    if (response.status !== 401) {
      return forwardBackendResponse(response, refreshedTokens);
    }

    let newTokens: AuthTokens | null = null;
    // If we already refreshed proactively in getValidAccessToken, a 401 means
    // the freshly-minted access token was itself rejected — refreshing again
    // with the now-stale cookie token only mints another orphan refresh row and
    // is near-certain to fail. Skip straight to the selection-token fallback so
    // each proxied request rotates at most once.
    if (!refreshedTokens) {
      const cookieStore = await cookies();
      const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;
      if (refreshToken) {
        try {
          newTokens = await refreshAuthTokens(refreshToken);
        } catch {
          // Network failure or backend error during refresh — fall through to
          // the selection-token fallback before giving up.
          newTokens = null;
        }
      }
    }

    if (!newTokens) {
      newTokens = await fallbackToSelectionToken(request);
    }

    if (!newTokens) {
      // Same rationale as above: forward the 401 but leave cookies intact so a
      // concurrent successful refresh isn't clobbered by this race loser.
      return forwardBackendResponse(response, null);
    }

    refreshedTokens = newTokens;
    const retryResponse = await fetch(backendUrl(backendPath), {
      method: request.method,
      headers: copyRequestHeaders(request, refreshedTokens.access_token),
      body: requestBody,
    });

    return forwardBackendResponse(retryResponse, refreshedTokens);
  } catch {
    // Never clear cookies on a transient failure (network blip, refresh race):
    // doing so would log out a session another in-flight request may have just
    // refreshed. Cookie clearing is reserved for explicit logout / the dedicated
    // refresh route.
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }
}

async function forwardBackendResponse(
  backendResponse: Response,
  tokens: AuthTokens | null,
) {
  const status = backendResponse.status;
  let response: NextResponse;
  if (status === 204) {
    response = new NextResponse(null, { status: 204 });
  } else {
    const backendBody = await readBackendJson(backendResponse);
    if (!backendResponse.ok && status >= 500) {
      console.error("[auth-transport] backend error", status);
    }
    response = NextResponse.json(
      backendResponse.ok ? backendBody : sanitizeBackendError(backendBody, status),
      { status },
    );
  }

  if (tokens) {
    setAuthCookies(response, tokens);
  }

  // Intentionally do NOT clear auth cookies on a 401 here. A 401 forwarded from
  // the backend can be a race loser while a concurrent request just refreshed
  // and set valid cookies; clearing would wipe that good session. Cookies are
  // only cleared by explicit logout or when /auth/refresh definitively rejects
  // the refresh token.

  // Pass through cache signals from the backend when present.
  // Fall back to a short private cache for successful GET responses so the
  // browser can serve repeated identical calls (e.g. after a soft-refresh)
  // without a round-trip to the proxy.
  if (backendResponse.ok) {
    const backendCacheControl = backendResponse.headers.get("cache-control");
    const backendEtag = backendResponse.headers.get("etag");
    const backendLastModified = backendResponse.headers.get("last-modified");

    if (backendCacheControl) {
      response.headers.set("cache-control", backendCacheControl);
    } else if (status !== 204) {
      response.headers.set("cache-control", "no-store");
    }

    if (backendEtag) response.headers.set("etag", backendEtag);
    if (backendLastModified) response.headers.set("last-modified", backendLastModified);
  }

  return response;
}
