import { describe, it, expect, vi, beforeEach } from "vitest";
import { SIGNUP_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";

vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  readBackendJson: vi.fn(),
  setSignupTokenCookie: vi.fn(),
  clearSignupTokenCookie: vi.fn(),
  setSelectionTokenCookie: vi.fn(),
  extractTokens: vi.fn(),
  sessionResponse: vi.fn(),
}));

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: cookieGet })),
}));

import {
  backendFetch,
  readBackendJson,
  setSignupTokenCookie,
} from "@/infrastructure/auth-transport/backend";
import { POST } from "./route";

const backendFetchMock = vi.mocked(backendFetch);
const readBackendJsonMock = vi.mocked(readBackendJson);
const setSignupTokenCookieMock = vi.mocked(setSignupTokenCookie);

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://test/api/auth/signup/verify", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
  });

  it("401s when neither the cookie nor the body carries a signup token", async () => {
    const res = await POST(makeRequest({ code: "123456" }));

    expect(res.status).toBe(401);
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("uses the cookie token, forwards the code, and re-persists a refreshed token", async () => {
    cookieGet.mockImplementation((name: string) =>
      name === SIGNUP_TOKEN_COOKIE ? { value: "cookie-tok" } : undefined,
    );
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({
      data: { signup_token: "fresh-tok", expires_in: 1800 },
      meta: {},
    });

    const res = await POST(makeRequest({ code: "123456" }));
    const json = (await res.json()) as { data: Record<string, unknown> };

    // The cookie token (not anything client-supplied) is sent to the backend.
    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/signup/verify",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ signup_token: "cookie-tok", code: "123456" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(setSignupTokenCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      "fresh-tok",
      1800,
    );
    expect(json.data).not.toHaveProperty("signup_token");
  });

  it("passes a backend 400 (invalid code) through unchanged", async () => {
    cookieGet.mockReturnValue({ value: "cookie-tok" });
    backendFetchMock.mockResolvedValue({ ok: false, status: 400 } as Response);
    readBackendJsonMock.mockResolvedValue({
      error: { code: "INVALID_CODE", message: "Incorrect verification code" },
    });

    const res = await POST(makeRequest({ code: "000000" }));

    expect(res.status).toBe(400);
    expect(setSignupTokenCookieMock).not.toHaveBeenCalled();
  });
});
