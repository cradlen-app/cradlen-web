import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/common/constants/auth-cookies";

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: cookieGet }),
}));

import { proxyAuthenticatedRequest } from "./backend";

/** Builds a `header.payload.signature` JWT whose `exp` is `secondsFromNow` out. */
function makeJwt(secondsFromNow: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

function tokenBody(refreshToken: string) {
  return {
    data: {
      access_token: makeJwt(3600),
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: 1800,
    },
    meta: {},
  };
}

describe("proxyAuthenticatedRequest token rotation", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("rotates at most once when a proactively refreshed token still 401s", async () => {
    // Expired access token + a present refresh token: getValidAccessToken
    // refreshes proactively before the backend call.
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(-60) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE) return { value: "refresh-stale" };
      // No selection token -> fallbackToSelectionToken returns null.
      return undefined;
    });

    vi.mocked(fetch)
      // 1. proactive refresh in getValidAccessToken
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenBody("refresh-new")), { status: 200 }),
      )
      // 2. backend request with the fresh access token -> still 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const request = new NextRequest("http://app.test/api/backend/visits", {
      method: "GET",
    });

    const response = await proxyAuthenticatedRequest(request, "/visits");

    // The fix: a 401 after a proactive refresh must NOT trigger a second
    // /auth/refresh — only one rotation row is created per request.
    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
    expect(response.status).toBe(401);
  });

  it("forwards a valid-token request without refreshing or rotating cookies", async () => {
    // Common path: a non-expired access token, backend answers 200.
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(3600) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE) return { value: "refresh-x" };
      return undefined;
    });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 }),
    );

    const request = new NextRequest("http://app.test/api/backend/visits", {
      method: "GET",
    });

    const response = await proxyAuthenticatedRequest(request, "/visits");

    expect(response.status).toBe(200);
    // No refresh of any kind, and no Set-Cookie rotation on the happy path.
    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(0);
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).not.toContain(AUTH_TOKEN_COOKIE);
  });

  it("refreshes once and retries when a valid token is rejected with 401", async () => {
    // A token that looks valid by exp but the backend rejects (clock skew /
    // server-side revocation): getValidAccessToken does NOT refresh, so the
    // on-401 branch must refresh once and retry. Fix 2's guard must not break
    // this legitimate path.
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(3600) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE) return { value: "refresh-onauth" };
      return undefined;
    });

    vi.mocked(fetch)
      // 1. backend request with the (valid-looking) access token -> 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // 2. on-401 refresh succeeds
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenBody("refresh-rotated")), {
          status: 200,
        }),
      )
      // 3. retry with the fresh access token -> 200
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true }, meta: {} }), {
          status: 200,
        }),
      );

    const request = new NextRequest("http://app.test/api/backend/visits", {
      method: "GET",
    });

    const response = await proxyAuthenticatedRequest(request, "/visits");

    expect(response.status).toBe(200);
    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(1);
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).toContain(AUTH_TOKEN_COOKIE);
    expect(setCookie).toContain(AUTH_REFRESH_TOKEN_COOKIE);
  });

  it("returns 401 WITHOUT clearing cookies when no tokens are present", async () => {
    cookieGet.mockImplementation(() => undefined);

    const request = new NextRequest("http://app.test/api/backend/visits", {
      method: "GET",
    });

    const response = await proxyAuthenticatedRequest(request, "/visits");

    expect(response.status).toBe(401);
    // No backend call is made at all. Crucially, cookies are NOT cleared: a
    // concurrent request racing the same refresh may have just set fresh tokens,
    // and clearing here would clobber that good session into a full logout.
    expect(fetch).not.toHaveBeenCalled();
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).not.toContain("Max-Age=0");
    expect(setCookie).not.toContain(AUTH_TOKEN_COOKIE);
    expect(setCookie).not.toContain(AUTH_REFRESH_TOKEN_COOKIE);
  });

  it("recovers via the selection token when a proactive refresh throws", async () => {
    // The cancel-payment bug: the access token expired while the user read the
    // page, so getValidAccessToken refreshes proactively — but that refresh
    // throws (rotated/stale refresh token, race, or a backend blip). The proxy
    // must NOT dead-end on "Authentication required"; it must fall through to the
    // selection-token fallback and complete the request.
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(-60) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE)
        return { value: "refresh-throws" };
      if (name === AUTH_SELECTION_TOKEN_COOKIE)
        return { value: "selection-alive" };
      return undefined;
    });

    vi.mocked(fetch)
      // 1. proactive refresh in getValidAccessToken -> throws (network/backend)
      .mockRejectedValueOnce(new Error("refresh exploded"))
      // 2. selection-token fallback -> mints a fresh pair
      .mockResolvedValueOnce(
        new Response(JSON.stringify(tokenBody("refresh-from-selection")), {
          status: 200,
        }),
      )
      // 3. backend request with the minted token -> 200
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: { ok: true }, meta: {} }), {
          status: 200,
        }),
      );

    const request = new NextRequest(
      "http://app.test/api/backend/organizations/o1/subscription/payments/p1/cancel",
      { method: "POST", headers: { "x-profile-id": "profile-1" } },
    );

    const response = await proxyAuthenticatedRequest(
      request,
      "/organizations/o1/subscription/payments/p1/cancel",
    );

    expect(response.status).toBe(200);
    const selectCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes("/auth/profiles/select"));
    expect(selectCalls).toHaveLength(1);
    // Fresh cookies from the selection mint are persisted.
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).toContain(AUTH_TOKEN_COOKIE);
  });

  it("returns 401 when a proactive refresh throws and no selection token exists", async () => {
    // Genuine session death: expired access token, the proactive refresh throws,
    // and there is no selection token to recover from. The generic 401 is correct
    // here (the client then re-verifies /auth/me and redirects).
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(-60) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE) return { value: "refresh-dead" };
      return undefined;
    });

    vi.mocked(fetch).mockRejectedValueOnce(new Error("refresh exploded"));

    const request = new NextRequest("http://app.test/api/backend/visits", {
      method: "GET",
    });

    const response = await proxyAuthenticatedRequest(request, "/visits");

    expect(response.status).toBe(401);
    const body = (await response.json()) as { message?: string };
    expect(body.message).toBe("Authentication required");
    // No cookies are cleared on this race-prone path.
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).not.toContain("Max-Age=0");
  });

  it("does not clobber cookies when refresh + fallback are exhausted on a 401", async () => {
    // A valid-looking token the backend rejects, the on-401 refresh fails, and
    // there is no selection token to fall back to. This is the classic race
    // loser: a sibling request may have already refreshed successfully, so this
    // path must forward the 401 WITHOUT emitting any cookie-clearing headers.
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(3600) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE) return { value: "refresh-loser" };
      return undefined;
    });

    vi.mocked(fetch)
      // 1. backend request with the valid-looking access token -> 401
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // 2. on-401 refresh -> backend rejects (race loser, already rotated)
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    const request = new NextRequest("http://app.test/api/backend/visits", {
      method: "GET",
    });

    const response = await proxyAuthenticatedRequest(request, "/visits");

    expect(response.status).toBe(401);
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).not.toContain("Max-Age=0");
  });
});
