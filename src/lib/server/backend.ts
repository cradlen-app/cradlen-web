import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_MAX_AGE,
  AUTH_TOKEN_COOKIE,
  DEFAULT_AUTH_EXPIRES_IN,
} from "@/features/auth/lib/auth.constants";
import type {
  AuthTokens,
  AuthTokensResponse,
} from "@/features/auth/types/sign-in.types";

export const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://api.cradlen.com/v1";

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

export function backendUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isExpiredJwt(token: string) {
  const [, payload] = token.split(".");
  if (!payload) return false;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded)) as { exp?: number };

    return typeof decoded.exp === "number" && decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
}

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

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(AUTH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
  response.cookies.set(AUTH_REFRESH_TOKEN_COOKIE, "", {
    ...AUTH_COOKIE_OPTIONS,
    maxAge: 0,
  });
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
    return NextResponse.json(body ?? { message: response.statusText }, {
      status: response.status,
    });
  }

  const tokens = extractTokens(body);
  return sessionResponse(tokens ? sanitize(body) : body, tokens, response.status);
}

async function refreshAuthTokens(refreshToken: string) {
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

  const refreshedTokens = await refreshAuthTokens(refreshToken);
  return { accessToken: refreshedTokens.access_token, refreshedTokens };
}

function copyRequestHeaders(request: NextRequest, accessToken: string) {
  const headers = new Headers(request.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
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
      const response = NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
      clearAuthCookies(response);
      return response;
    }

    const response = await fetch(backendUrl(backendPath), {
      method: request.method,
      headers: copyRequestHeaders(request, validToken.accessToken),
      body: requestBody,
    });

    if (response.status !== 401) {
      return forwardBackendResponse(response, refreshedTokens);
    }

    const cookieStore = await cookies();
    const refreshToken = cookieStore.get(AUTH_REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
      const unauthorized = await forwardBackendResponse(response, null);
      clearAuthCookies(unauthorized);
      return unauthorized;
    }

    refreshedTokens = await refreshAuthTokens(refreshToken);
    const retryResponse = await fetch(backendUrl(backendPath), {
      method: request.method,
      headers: copyRequestHeaders(request, refreshedTokens.access_token),
      body: requestBody,
    });

    return forwardBackendResponse(retryResponse, refreshedTokens);
  } catch {
    const response = NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
    clearAuthCookies(response);
    return response;
  }
}

async function forwardBackendResponse(
  backendResponse: Response,
  tokens: AuthTokens | null,
) {
  const body = await readBackendJson(backendResponse);
  const response = NextResponse.json(body, { status: backendResponse.status });

  if (tokens) {
    setAuthCookies(response, tokens);
  }

  if (backendResponse.status === 401) {
    clearAuthCookies(response);
  }

  return response;
}
