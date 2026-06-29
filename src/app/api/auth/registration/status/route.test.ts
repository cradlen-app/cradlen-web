import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));
vi.mock("@/infrastructure/auth-transport/backend", () => ({
  backendFetch: vi.fn(),
  readBackendJson: vi.fn(),
}));

import { cookies } from "next/headers";
import {
  backendFetch,
  readBackendJson,
} from "@/infrastructure/auth-transport/backend";
import { AUTH_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";
import { GET } from "./route";

const cookiesMock = vi.mocked(cookies);
const backendFetchMock = vi.mocked(backendFetch);
const readBackendJsonMock = vi.mocked(readBackendJson);

function mockCookieStore(values: Record<string, string>) {
  return {
    get: (name: string) =>
      values[name] !== undefined ? { value: values[name] } : undefined,
  } as unknown as Awaited<ReturnType<typeof cookies>>;
}

function makeRequest(email = "user@example.com") {
  return new NextRequest(
    `http://localhost/api/auth/registration/status?email=${encodeURIComponent(email)}`,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  cookiesMock.mockResolvedValue(mockCookieStore({}));
  backendFetchMock.mockResolvedValue({ ok: true, status: 200 } as Response);
});

describe("GET /api/auth/registration/status", () => {
  it("attaches a bearer header from the access-token cookie and reads the step", async () => {
    cookiesMock.mockResolvedValue(
      mockCookieStore({ [AUTH_TOKEN_COOKIE]: "access-1" }),
    );
    readBackendJsonMock.mockResolvedValue({ step: "VERIFY_OTP" });

    const res = await GET(makeRequest("a@b.c"));

    expect(backendFetchMock).toHaveBeenCalledWith(
      "/auth/registration/status?email=a%40b.c",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer access-1" },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { step: string };
    expect(json.step).toBe("VERIFY_OTP");
  });

  it("omits the auth header when no access-token cookie exists", async () => {
    readBackendJsonMock.mockResolvedValue({ step: "DONE" });

    await GET(makeRequest());

    expect(backendFetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: undefined }),
    );
  });

  it("reads the step from a nested data envelope", async () => {
    readBackendJsonMock.mockResolvedValue({ data: { step: "COMPLETE_ONBOARDING" } });

    const res = await GET(makeRequest());
    const json = (await res.json()) as { step: string };

    expect(json.step).toBe("COMPLETE_ONBOARDING");
  });

  it("normalizes an unknown step value to NONE", async () => {
    readBackendJsonMock.mockResolvedValue({ step: "BOGUS" });

    const res = await GET(makeRequest());
    const json = (await res.json()) as { step: string };

    expect(json.step).toBe("NONE");
  });

  it("returns NONE when the body has no step", async () => {
    readBackendJsonMock.mockResolvedValue({ data: {} });

    const res = await GET(makeRequest());
    const json = (await res.json()) as { step: string };

    expect(json.step).toBe("NONE");
  });

  it("passes a backend error through with its status", async () => {
    backendFetchMock.mockResolvedValue({ ok: false, status: 404 } as Response);
    readBackendJsonMock.mockResolvedValue({ error: { code: "NOT_FOUND" } });

    const res = await GET(makeRequest());

    expect(res.status).toBe(404);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("NOT_FOUND");
  });
});
