import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the low-level transport so the real signup-session wiring (token
// extraction, body sanitization, cookie persistence) runs under test.
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
  return new Request("http://test/api/auth/signup/start", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("persists the signup token to a cookie and strips it from the response body", async () => {
    backendFetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);
    readBackendJsonMock.mockResolvedValue({
      data: { signup_token: "tok-123", expires_in: 1800, email: "x@y.z" },
      meta: {},
    });

    const res = await POST(
      makeRequest({ email: "x@y.z", password: "Password1!" }),
    );
    const json = (await res.json()) as { data: Record<string, unknown> };

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/signup/start",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.status).toBe(201);
    // Token is persisted to the HttpOnly cookie...
    expect(setSignupTokenCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      "tok-123",
      1800,
    );
    // ...and never leaked back to the browser in the JSON body.
    expect(json.data).not.toHaveProperty("signup_token");
    expect(json.data).toMatchObject({ expires_in: 1800, email: "x@y.z" });
  });

  it("passes a backend error through with its status and sets no cookie", async () => {
    backendFetchMock.mockResolvedValue({ ok: false, status: 409 } as Response);
    readBackendJsonMock.mockResolvedValue({
      error: { code: "CONFLICT", message: "User already exists" },
    });

    const res = await POST(makeRequest({ email: "dupe@y.z" }));

    expect(res.status).toBe(409);
    expect(setSignupTokenCookieMock).not.toHaveBeenCalled();
  });
});
