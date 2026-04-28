import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_REFRESH_TOKEN_COOKIE,
  AUTH_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import { extractTokens, proxySessionEndpoint } from "./backend";

const tokenBody = {
  data: {
    access_token: "access-token",
    refresh_token: "refresh-token",
    token_type: "Bearer",
    expires_in: 3600,
  },
  meta: {},
};

describe("backend session helpers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("extracts tokens from wrapped backend responses", () => {
    expect(extractTokens(tokenBody)).toEqual(tokenBody.data);
  });

  it("sets HttpOnly cookies and sanitizes successful session responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(tokenBody), { status: 200 }),
    );

    const response = await proxySessionEndpoint(
      "/auth/login",
      new Request("http://app.test/api/auth/login", { method: "POST" }),
    );
    const body = await response.json();
    const setCookie = response.headers.getSetCookie().join("; ");

    expect(body).toEqual({ data: { authenticated: true }, meta: {} });
    expect(setCookie).toContain(AUTH_TOKEN_COOKIE);
    expect(setCookie).toContain(AUTH_REFRESH_TOKEN_COOKIE);
    expect(setCookie).toContain("HttpOnly");
    expect(JSON.stringify(body)).not.toContain("access-token");
    expect(JSON.stringify(body)).not.toContain("refresh-token");
  });

  it("forwards backend errors without setting auth cookies", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
      }),
    );

    const response = await proxySessionEndpoint(
      "/auth/login",
      new Request("http://app.test/api/auth/login", { method: "POST" }),
    );

    await expect(response.json()).resolves.toEqual({
      message: "Invalid credentials",
    });
    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
