import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: cookieGet }),
}));

import { POST } from "./route";

const ACCESS_TOKEN = "new-access-token-value";
const REFRESH_TOKEN = "new-refresh-token-value";

const tokenBody = {
  data: {
    access_token: ACCESS_TOKEN,
    refresh_token: REFRESH_TOKEN,
    token_type: "Bearer",
    expires_in: 1800,
  },
  meta: {},
};

function setRefreshCookie(value: string | undefined) {
  cookieGet.mockImplementation((name: string) =>
    name === AUTH_REFRESH_TOKEN_COOKIE && value ? { value } : undefined,
  );
}

describe("POST /api/auth/refresh route handler", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("401s and clears auth cookies when no refresh cookie is present", async () => {
    setRefreshCookie(undefined);

    const response = await POST();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      message: "Missing refresh token",
    });
    expect(fetch).not.toHaveBeenCalled();

    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).toContain(`${AUTH_TOKEN_COOKIE}=`);
    expect(setCookie).toContain(`${AUTH_REFRESH_TOKEN_COOKIE}=`);
    expect(setCookie).toContain("Max-Age=0");
  });

  it("rotates cookies and returns a sanitized session on success", async () => {
    setRefreshCookie("stored-refresh-token");
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(tokenBody), { status: 200 }),
    );

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(200);
    // expires_in is surfaced (non-sensitive) so the client can schedule its
    // proactive refresh; the raw tokens stay HttpOnly-cookie only.
    expect(body).toEqual({
      data: { authenticated: true, expires_in: 1800 },
      meta: {},
    });

    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).toContain(AUTH_TOKEN_COOKIE);
    expect(setCookie).toContain(AUTH_REFRESH_TOKEN_COOKIE);
    expect(setCookie).toContain("HttpOnly");

    // The raw tokens must never appear in the JSON body — only in HttpOnly cookies.
    expect(JSON.stringify(body)).not.toContain(ACCESS_TOKEN);
    expect(JSON.stringify(body)).not.toContain(REFRESH_TOKEN);
  });

  it("returns 401 WITHOUT clearing cookies when refresh is rejected (race-safe)", async () => {
    setRefreshCookie("revoked-refresh-token");
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "Refresh token revoked or expired" }),
        { status: 401 },
      ),
    );

    const response = await POST();

    expect(response.status).toBe(401);
    // A concurrent rotation may have just set fresh cookies and the recovery
    // (selection) cookie must survive — so a failed refresh must NOT wipe
    // cookies. The client verifies /auth/me before it logs the user out.
    const setCookie = response.headers.getSetCookie().join("; ");
    expect(setCookie).not.toContain("Max-Age=0");
  });
});
