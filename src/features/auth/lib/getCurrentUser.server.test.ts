import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ get: cookieGet }),
}));

import { getCurrentUser } from "./getCurrentUser.server";

/** Builds a `header.payload.signature` JWT whose `exp` is `secondsFromNow` out. */
function makeJwt(secondsFromNow: number): string {
  const payload = Buffer.from(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + secondsFromNow }),
  ).toString("base64url");
  return `header.${payload}.signature`;
}

function setAccessCookie(value: string | undefined) {
  cookieGet.mockImplementation((name: string) =>
    name === AUTH_TOKEN_COOKIE && value ? { value } : undefined,
  );
}

const meBody = {
  data: { id: "user-1", first_name: "Nour", profiles: [] },
  meta: {},
};

describe("getCurrentUser (server)", () => {
  beforeEach(() => {
    cookieGet.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("fetches /auth/me with a valid access token and never rotates", async () => {
    setAccessCookie(makeJwt(3600));
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(meBody), { status: 200 }),
    );

    const user = await getCurrentUser();

    expect(user).toEqual(meBody.data);
    expect(fetch).toHaveBeenCalledTimes(1);
    const calledUrl = String(vi.mocked(fetch).mock.calls[0][0]);
    expect(calledUrl).toContain("/auth/me");
    // The Server Component must never call the rotating refresh endpoint.
    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(0);
  });

  it("returns null for an expired access token without calling the backend", async () => {
    setAccessCookie(makeJwt(-60));

    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when no access token is present", async () => {
    setAccessCookie(undefined);

    const user = await getCurrentUser();

    expect(user).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns null when /auth/me rejects a valid token, never rotating", async () => {
    setAccessCookie(makeJwt(3600));
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));

    const user = await getCurrentUser();

    expect(user).toBeNull();
    // The Server Component must not attempt a rotation to recover; that is the
    // client's job via /api/auth/me.
    const refreshCalls = vi
      .mocked(fetch)
      .mock.calls.filter(([url]) => String(url).includes("/auth/refresh"));
    expect(refreshCalls).toHaveLength(0);
  });
});
