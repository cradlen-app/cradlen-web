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
  sanitizeBackendError: vi.fn((body: unknown) => body ?? { message: "error" }),
}));

const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve({ get: cookieGet })),
}));

import {
  backendFetch,
  readBackendJson,
  setSelectionTokenCookie,
  clearSignupTokenCookie,
} from "@/infrastructure/auth-transport/backend";
import { POST } from "./route";

const backendFetchMock = vi.mocked(backendFetch);
const readBackendJsonMock = vi.mocked(readBackendJson);
const setSelectionTokenCookieMock = vi.mocked(setSelectionTokenCookie);
const clearSignupTokenCookieMock = vi.mocked(clearSignupTokenCookie);

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://test/api/auth/signup/complete", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signup/complete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieGet.mockReturnValue(undefined);
  });

  it("401s when no signup token is present in cookie or body", async () => {
    const res = await POST(makeRequest({ organization_name: "Clinic" }));

    expect(res.status).toBe(401);
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("swaps the signup-token cookie for a selection-token cookie on success", async () => {
    cookieGet.mockImplementation((name: string) =>
      name === SIGNUP_TOKEN_COOKIE ? { value: "signup-tok" } : undefined,
    );
    backendFetchMock.mockResolvedValue({ ok: true, status: 201 } as Response);
    readBackendJsonMock.mockResolvedValue({
      data: {
        type: "profile_selection",
        selection_token: "sel-tok",
        profiles: [{ profile_id: "p1" }],
      },
      meta: {},
    });

    const res = await POST(makeRequest({ organization_name: "Clinic" }));
    const json = (await res.json()) as { data: Record<string, unknown> };

    // The cookie's signup token is injected into the backend payload.
    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/signup/complete",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.status).toBe(201);
    // Selection token is moved into its own cookie; signup cookie is cleared.
    expect(setSelectionTokenCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      "sel-tok",
    );
    expect(clearSignupTokenCookieMock).toHaveBeenCalled();
    // The selection token is stripped from the JSON body.
    expect(json.data).not.toHaveProperty("selection_token");
  });

  it("passes a backend 409 (already onboarded) through and does not set a selection cookie", async () => {
    cookieGet.mockReturnValue({ value: "signup-tok" });
    backendFetchMock.mockResolvedValue({ ok: false, status: 409 } as Response);
    readBackendJsonMock.mockResolvedValue({
      error: { code: "CONFLICT", message: "Onboarding already completed" },
    });

    const res = await POST(makeRequest({ organization_name: "Clinic" }));

    expect(res.status).toBe(409);
    expect(setSelectionTokenCookieMock).not.toHaveBeenCalled();
  });
});
