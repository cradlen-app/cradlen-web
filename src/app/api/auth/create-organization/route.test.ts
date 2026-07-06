import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  readBackendJson: vi.fn(),
  setSelectionTokenCookie: vi.fn(),
}));
vi.mock("@/infrastructure/auth-transport/multi-tenant-auth", () => ({
  extractSelectionToken: vi.fn(),
  sanitizeProfileSelection: vi.fn(),
}));

import { cookies } from "next/headers";
import {
  backendFetch,
  readBackendJson,
  setSelectionTokenCookie,
} from "@/infrastructure/auth-transport/backend";
import {
  extractSelectionToken,
  sanitizeProfileSelection,
} from "@/infrastructure/auth-transport/multi-tenant-auth";
import {
  AUTH_TOKEN_COOKIE,
  AUTH_SELECTION_TOKEN_COOKIE,
} from "@/features/auth/lib/auth.constants";
import { POST } from "./route";

const cookiesMock = vi.mocked(cookies);
const backendFetchMock = vi.mocked(backendFetch);
const readBackendJsonMock = vi.mocked(readBackendJson);
const setSelectionTokenCookieMock = vi.mocked(setSelectionTokenCookie);
const extractSelectionTokenMock = vi.mocked(extractSelectionToken);
const sanitizeProfileSelectionMock = vi.mocked(sanitizeProfileSelection);

function mockCookieStore(values: Record<string, string>) {
  return {
    get: (name: string) =>
      values[name] !== undefined ? { value: values[name] } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>;
}

function makeRequest() {
  return new Request("http://localhost/api/auth/create-organization", {
    method: "POST",
    body: JSON.stringify({ name: "Clinic" }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/create-organization", () => {
  it("returns 401 when neither an access nor a selection token is present", async () => {
    cookiesMock.mockResolvedValue(mockCookieStore({}));

    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    const json = (await res.json()) as { message: string };
    expect(json.message).toBe("Authentication required");
    expect(backendFetchMock).not.toHaveBeenCalled();
  });

  it("forwards backend errors with their status when org creation fails", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_TOKEN_COOKIE]: "access-1" }),
    );
    backendFetchMock.mockResolvedValueOnce({ ok: false, status: 422 } as Response);
    readBackendJsonMock.mockResolvedValueOnce({
      error: { code: "VALIDATION", message: "bad" },
    });

    const res = await POST(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/organizations",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer access-1" },
      }),
    );
    expect(res.status).toBe(422);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("VALIDATION");
  });

  it("refreshes profiles and mints a selection token cookie after creation", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_TOKEN_COOKIE]: "access-1" }),
    );
    backendFetchMock
      .mockResolvedValueOnce({ ok: true, status: 201 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValueOnce({ data: { profiles: ["raw"] } });
    extractSelectionTokenMock.mockReturnValue("sel-token");
    sanitizeProfileSelectionMock.mockReturnValue({
      data: { profiles: ["clean"] },
      meta: {},
    });

    const res = await POST(makeRequest());

    expect(backendFetchMock).toHaveBeenNthCalledWith(
      2,
      "/auth/profiles",
      expect.objectContaining({ headers: { Authorization: "Bearer access-1" } }),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { profiles: string[] } };
    expect(json.data.profiles).toEqual(["clean"]);
    expect(setSelectionTokenCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      "sel-token",
    );
  });

  it("does not set a selection cookie when no token is returned", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_TOKEN_COOKIE]: "access-1" }),
    );
    backendFetchMock
      .mockResolvedValueOnce({ ok: true, status: 201 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);
    readBackendJsonMock.mockResolvedValueOnce({ data: { profiles: [] } });
    extractSelectionTokenMock.mockReturnValue(null);
    sanitizeProfileSelectionMock.mockReturnValue({
      data: { profiles: [] },
      meta: {},
    });

    await POST(makeRequest());

    expect(setSelectionTokenCookieMock).not.toHaveBeenCalled();
  });

  it("falls back to the create response when the profiles refresh fails", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_TOKEN_COOKIE]: "access-1" }),
    );
    backendFetchMock
      .mockResolvedValueOnce({ ok: true, status: 201 } as Response)
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response);
    readBackendJsonMock.mockResolvedValueOnce({ data: { id: "org-9" } });

    const res = await POST(makeRequest());

    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { id: string } };
    expect(json.data.id).toBe("org-9");
    expect(sanitizeProfileSelectionMock).not.toHaveBeenCalled();
  });

  it("routes a selection-token-only user to the bootstrap endpoint and mints the returned selection cookie", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_SELECTION_TOKEN_COOKIE]: "sel-bearer" }),
    );
    backendFetchMock.mockResolvedValueOnce({ ok: true, status: 201 } as Response);
    readBackendJsonMock.mockResolvedValueOnce({
      data: { type: "profile_selection", selection_token: "new-sel", profiles: ["raw"] },
    });
    extractSelectionTokenMock.mockReturnValue("new-sel");
    sanitizeProfileSelectionMock.mockReturnValue({
      data: { type: "profile_selection", profiles: ["clean"] },
      meta: {},
    });

    const res = await POST(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledTimes(1);
    expect(backendFetchMock).toHaveBeenCalledWith(
      "/organizations/bootstrap",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer sel-bearer" },
      }),
    );
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { profiles: string[] } };
    expect(json.data.profiles).toEqual(["clean"]);
    expect(setSelectionTokenCookieMock).toHaveBeenCalledWith(
      expect.anything(),
      "new-sel",
    );
  });

  it("forwards a bootstrap error (e.g. the user still has an active membership)", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_SELECTION_TOKEN_COOKIE]: "sel-bearer" }),
    );
    backendFetchMock.mockResolvedValueOnce({ ok: false, status: 403 } as Response);
    readBackendJsonMock.mockResolvedValueOnce({
      error: { code: "FORBIDDEN", message: "no" },
    });

    const res = await POST(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/organizations/bootstrap",
      expect.anything(),
    );
    expect(res.status).toBe(403);
    expect(sanitizeProfileSelectionMock).not.toHaveBeenCalled();
  });
});
