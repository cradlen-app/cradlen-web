import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";

/**
 * Route-guard contract for `src/proxy.ts`. The proxy is only an optimistic gate
 * (backend authz stays authoritative), but a regression here can either leak a
 * protected page to an anonymous user or lock an onboarding user out — so the
 * public/protected classification and the selection-token allow-list are pinned.
 */

const { isExpiredJwtMock } = vi.hoisted(() => ({
  isExpiredJwtMock: vi.fn(),
}));

// next-intl middleware: stand in with a sentinel so "request passed through" is
// observable and distinct from a redirect.
vi.mock("next-intl/middleware", () => ({
  default: () => () => ({ kind: "intl-passthrough" }),
}));

// NextResponse.redirect: capture the target URL instead of building a Response.
vi.mock("next/server", () => ({
  NextResponse: {
    redirect: (url: URL) => ({ kind: "redirect", location: url.toString() }),
  },
}));

vi.mock("@/infrastructure/auth-transport/jwt", () => ({
  isExpiredJwt: (token: string) => isExpiredJwtMock(token),
}));

import proxy from "./proxy";

type Cookies = Record<string, string>;

function makeRequest(
  pathname: string,
  opts: { cookies?: Cookies; search?: string } = {},
) {
  const { cookies = {}, search = "" } = opts;
  return {
    nextUrl: { pathname, search },
    url: `https://app.cradlen.com${pathname}${search}`,
    cookies: {
      get: (name: string) =>
        name in cookies ? { value: cookies[name] } : undefined,
    },
  } as unknown as Parameters<typeof proxy>[0];
}

const VALID_AUTH = { [AUTH_TOKEN_COOKIE]: "valid.jwt.token" };

beforeEach(() => {
  isExpiredJwtMock.mockReset();
  // Default: any present auth token is considered live unless a test says otherwise.
  isExpiredJwtMock.mockReturnValue(false);
});

describe("proxy — public routes pass through without a session", () => {
  const publicPaths = [
    "/", // marketing landing
    "/en", // localized landing
    "/en/sign-in",
    "/en/sign-up",
    "/ar/forgot-password",
    "/en/terms-of-service",
    "/en/privacy-policy",
    "/en/help-center",
    "/en/guide",
    "/en/guide/getting-started", // nested under a public prefix
    "/en/invitations/accept",
  ];

  for (const path of publicPaths) {
    it(`${path} is public`, () => {
      const res = proxy(makeRequest(path)) as unknown as { kind: string };
      expect(res.kind).toBe("intl-passthrough");
    });
  }
});

describe("proxy — protected routes require a session", () => {
  it("redirects an anonymous user to localized sign-in with a redirectTo", () => {
    const res = proxy(
      makeRequest("/en/org1/branch1/dashboard"),
    ) as unknown as { kind: string; location: string };

    expect(res.kind).toBe("redirect");
    const url = new URL(res.location);
    expect(url.pathname).toBe("/en/sign-in");
    expect(url.searchParams.get("redirectTo")).toBe("/org1/branch1/dashboard");
  });

  it("preserves the original query string in redirectTo", () => {
    const res = proxy(
      makeRequest("/en/visits", { search: "?status=open" }),
    ) as unknown as { kind: string; location: string };

    const url = new URL(res.location);
    expect(url.searchParams.get("redirectTo")).toBe("/visits?status=open");
  });

  it("redirects using the request locale (ar)", () => {
    const res = proxy(
      makeRequest("/ar/dashboard"),
    ) as unknown as { kind: string; location: string };

    expect(new URL(res.location).pathname).toBe("/ar/sign-in");
  });

  it("falls back to the default locale when the path has no locale prefix", () => {
    const res = proxy(makeRequest("/dashboard")) as unknown as {
      kind: string;
      location: string;
    };

    expect(new URL(res.location).pathname).toBe("/en/sign-in");
  });

  it("treats a trailing slash the same as the bare protected path", () => {
    const res = proxy(makeRequest("/en/dashboard/")) as unknown as { kind: string };
    expect(res.kind).toBe("redirect");
  });
});

describe("proxy — token acceptance", () => {
  it("passes a request carrying a live auth token", () => {
    isExpiredJwtMock.mockReturnValue(false);
    const res = proxy(
      makeRequest("/en/dashboard", { cookies: VALID_AUTH }),
    ) as unknown as { kind: string };
    expect(res.kind).toBe("intl-passthrough");
  });

  it("passes when the auth token is expired but a refresh token is present", () => {
    isExpiredJwtMock.mockReturnValue(true);
    const res = proxy(
      makeRequest("/en/dashboard", {
        cookies: {
          [AUTH_TOKEN_COOKIE]: "expired",
          [AUTH_REFRESH_TOKEN_COOKIE]: "refresh",
        },
      }),
    ) as unknown as { kind: string };
    expect(res.kind).toBe("intl-passthrough");
  });

  it("redirects when the only auth token is expired and there is no refresh", () => {
    isExpiredJwtMock.mockReturnValue(true);
    const res = proxy(
      makeRequest("/en/dashboard", {
        cookies: { [AUTH_TOKEN_COOKIE]: "expired" },
      }),
    ) as unknown as { kind: string };
    expect(res.kind).toBe("redirect");
  });
});

describe("proxy — selection-token onboarding allow-list", () => {
  it("lets a selection-token user reach /create-organization", () => {
    const res = proxy(
      makeRequest("/en/create-organization", {
        cookies: { [AUTH_SELECTION_TOKEN_COOKIE]: "sel" },
      }),
    ) as unknown as { kind: string };
    expect(res.kind).toBe("intl-passthrough");
  });

  it("lets a selection-token user reach /select-profile", () => {
    const res = proxy(
      makeRequest("/ar/select-profile", {
        cookies: { [AUTH_SELECTION_TOKEN_COOKIE]: "sel" },
      }),
    ) as unknown as { kind: string };
    expect(res.kind).toBe("intl-passthrough");
  });

  it("does NOT let a selection-token user reach the dashboard", () => {
    const res = proxy(
      makeRequest("/en/org1/branch1/dashboard", {
        cookies: { [AUTH_SELECTION_TOKEN_COOKIE]: "sel" },
      }),
    ) as unknown as { kind: string };
    expect(res.kind).toBe("redirect");
  });
});
