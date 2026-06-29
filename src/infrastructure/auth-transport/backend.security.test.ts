import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/common/constants/auth-cookies";

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: cookieGet }),
}));

import {
  clearAuthCookies,
  proxyAuthenticatedRequest,
  setAuthCookies,
} from "./backend";

/** Builds a `header.payload.signature` JWT whose `exp` is `secondsFromNow` out. */
function makeJwt(secondsFromNow: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

describe("proxy header hygiene (no credential smuggling)", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    vi.stubGlobal("fetch", vi.fn());
    // A valid, non-expired access token: the happy path forwards in one call.
    cookieGet.mockImplementation((name: string) => {
      if (name === AUTH_TOKEN_COOKIE) return { value: makeJwt(3600) };
      if (name === AUTH_REFRESH_TOKEN_COOKIE) return { value: "refresh-x" };
      return undefined;
    });
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: [], meta: {} }), { status: 200 }),
    );
  });

  async function forwardedHeaders(requestInit: {
    method?: string;
    headers?: Record<string, string>;
  }) {
    const request = new NextRequest(
      "http://app.test/api/backend/patients",
      requestInit,
    );
    await proxyAuthenticatedRequest(request, "/patients");
    const call = vi.mocked(fetch).mock.calls.at(-1);
    return call?.[1]?.headers as Headers;
  }

  it("overwrites a client-supplied Authorization header with the real bearer token", async () => {
    const headers = await forwardedHeaders({
      method: "GET",
      headers: {
        Authorization: "Bearer attacker-forged-token",
      },
    });

    const auth = headers.get("authorization");
    expect(auth).toBe(`Bearer ${makeJwt(3600)}`);
    expect(auth).not.toContain("attacker-forged-token");
  });

  it("strips the raw cookie header so session cookies never reach the backend", async () => {
    const headers = await forwardedHeaders({
      method: "GET",
      headers: {
        cookie: `${AUTH_TOKEN_COOKIE}=super-secret; ${AUTH_REFRESH_TOKEN_COOKIE}=also-secret`,
      },
    });

    expect(headers.get("cookie")).toBeNull();
  });

  it("forwards the tenant-context headers verbatim for backend authorization", async () => {
    const headers = await forwardedHeaders({
      method: "GET",
      headers: {
        "x-organization-id": "org-b",
        "x-profile-id": "profile-b",
        "x-branch-id": "branch-b",
      },
    });

    expect(headers.get("x-organization-id")).toBe("org-b");
    expect(headers.get("x-profile-id")).toBe("profile-b");
    expect(headers.get("x-branch-id")).toBe("branch-b");
  });
});

describe("auth cookie flags", () => {
  it("sets access + refresh tokens HttpOnly, SameSite=Lax, Path=/", () => {
    const response = NextResponse.json({ ok: true });
    setAuthCookies(response, {
      access_token: "a-token",
      refresh_token: "r-token",
      token_type: "Bearer",
      expires_in: 3600,
    });

    const setCookies = response.headers.getSetCookie();
    const access = setCookies.find((c) => c.startsWith(`${AUTH_TOKEN_COOKIE}=`));
    const refresh = setCookies.find((c) =>
      c.startsWith(`${AUTH_REFRESH_TOKEN_COOKIE}=`),
    );

    for (const cookie of [access, refresh]) {
      expect(cookie).toBeDefined();
      expect(cookie).toMatch(/httponly/i);
      expect(cookie).toMatch(/samesite=lax/i);
      expect(cookie).toMatch(/path=\//i);
    }
  });

  it("clearAuthCookies zeroes every auth cookie (Max-Age=0)", () => {
    const response = NextResponse.json({ ok: true });
    clearAuthCookies(response);

    const setCookies = response.headers.getSetCookie();
    const cleared = [
      AUTH_TOKEN_COOKIE,
      AUTH_REFRESH_TOKEN_COOKIE,
      AUTH_SELECTION_TOKEN_COOKIE,
    ];

    for (const name of cleared) {
      const cookie = setCookies.find((c) => c.startsWith(`${name}=`));
      expect(cookie, `expected ${name} to be cleared`).toBeDefined();
      expect(cookie).toMatch(/max-age=0/i);
    }
  });
});
