import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  readBackendJson: vi.fn(),
  setSignupTokenCookie: vi.fn(),
  clearSignupTokenCookie: vi.fn(),
  setSelectionTokenCookie: vi.fn(),
  extractTokens: vi.fn(),
  sessionResponse: vi.fn(),
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
  return new Request("http://test/api/auth/signup/resend", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup/resend", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success and re-persists a refreshed token when the backend supplies one", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValue({
      data: { success: true, signup_token: "refreshed-tok", expires_in: 1800 },
      meta: {},
    });

    const res = await POST(makeRequest({ email: "x@y.z" }));
    const json = (await res.json()) as { data: Record<string, unknown> };

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/signup/resend",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.status).toBe(200);
    expect(setSignupTokenCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      "refreshed-tok",
      1800,
    );
    expect(json.data).not.toHaveProperty("signup_token");
    expect(json.data).toMatchObject({ success: true });
  });

  it("passes a 429 rate-limit response through and sets no cookie", async () => {
    backendFetchMock.mockResolvedValue({ ok: false, status: 429 } as Response);
    readBackendJsonMock.mockResolvedValue({
      error: { code: "RESEND_LIMIT_EXCEEDED", message: "Too many resends" },
    });

    const res = await POST(makeRequest({ email: "x@y.z" }));

    expect(res.status).toBe(429);
    expect(setSignupTokenCookieMock).not.toHaveBeenCalled();
  });
});
