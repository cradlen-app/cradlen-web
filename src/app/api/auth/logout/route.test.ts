import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  clearAuthCookies: vi.fn(),
}));

import { cookies } from "next/headers";
import {
  backendFetch,
  clearAuthCookies,
} from "@/infrastructure/auth-transport/backend";
import {
  AUTH_TOKEN_COOKIE,
  AUTH_REFRESH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import { POST } from "./route";

const cookiesMock = vi.mocked(cookies);
const backendFetchMock = vi.mocked(backendFetch);
const clearAuthCookiesMock = vi.mocked(clearAuthCookies);

function mockCookieStore(values: Record<string, string>) {
  return {
    get: (name: string) =>
      values[name] !== undefined ? { value: values[name] } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>;
}

beforeEach(() => {
  vi.clearAllMocks();
  backendFetchMock.mockResolvedValue(new Response(null, { status: 204 }));
});

describe("POST /api/auth/logout", () => {
  it("revokes the refresh token upstream and clears auth cookies", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({
        [AUTH_TOKEN_COOKIE]: "access-abc",
        [AUTH_REFRESH_TOKEN_COOKIE]: "refresh-xyz",
      }),
    );

    const res = await POST();

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer access-abc" },
        body: JSON.stringify({ refresh_token: "refresh-xyz" }),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { authenticated: boolean } };
    expect(json.data.authenticated).toBe(false);
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
  });

  it("sends an empty auth header when only a refresh token exists", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_REFRESH_TOKEN_COOKIE]: "refresh-only" }),
    );

    await POST();

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/logout",
      expect.objectContaining({ headers: {} }),
    );
  });

  it("skips the upstream call when no refresh token is present", async () => {
    cookiesMock.mockResolvedValue(mockCookieStore({}));

    const res = await POST();

    expect(backendFetchMock).not.toHaveBeenCalled();
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
    const json = (await res.json()) as { data: { authenticated: boolean } };
    expect(json.data.authenticated).toBe(false);
  });

  it("still clears cookies when the upstream revoke call rejects", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_REFRESH_TOKEN_COOKIE]: "refresh-xyz" }),
    );
    backendFetchMock.mockRejectedValue(new Error("network down"));

    const res = await POST();

    expect(res.status).toBe(200);
    expect(clearAuthCookiesMock).toHaveBeenCalledTimes(1);
  });
});
