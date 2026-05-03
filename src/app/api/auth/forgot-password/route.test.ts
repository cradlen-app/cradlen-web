import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { RESET_TOKEN_COOKIE } from "@/features/auth/lib/auth.constants";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  url: string,
  body: unknown,
  cookies: Record<string, string> = {},
): NextRequest {
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  });
}

function backendOk(data: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify({ data, meta: {} }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function backendError(status: number, code: string) {
  return Promise.resolve(
    new Response(JSON.stringify({ error: { code, statusCode: status } }), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

// ---------------------------------------------------------------------------
// Mock fetch used by backendFetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  vi.stubGlobal("fetch", mockFetch);
});

// ---------------------------------------------------------------------------
// start
// ---------------------------------------------------------------------------

describe("POST /api/auth/forgot-password/start", () => {
  async function callStart(body: unknown) {
    const { POST } = await import("./start/route");
    return POST(makeRequest("http://localhost/api/auth/forgot-password/start", body));
  }

  it("sets the reset-token cookie on success", async () => {
    mockFetch.mockResolvedValueOnce(
      backendOk({ reset_token: "tok-abc", expires_in: 1800 }),
    );

    const res = await callStart({ email: "user@example.com" });

    expect(res.status).toBe(200);
    const body = await res.json() as { data: { success: boolean } };
    expect(body.data.success).toBe(true);
    expect(res.cookies.get(RESET_TOKEN_COOKIE)?.value).toBe("tok-abc");
  });

  it("does not set cookie when backend returns no token (unknown email)", async () => {
    mockFetch.mockResolvedValueOnce(
      backendOk({ reset_token: "", expires_in: 0 }),
    );

    const res = await callStart({ email: "ghost@example.com" });

    expect(res.status).toBe(200);
    expect(res.cookies.get(RESET_TOKEN_COOKIE)?.value ?? "").toBe("");
  });

  it("forwards backend errors without setting a cookie", async () => {
    mockFetch.mockResolvedValueOnce(backendError(429, "RATE_LIMITED"));

    const res = await callStart({ email: "user@example.com" });

    expect(res.status).toBe(429);
    expect(res.cookies.get(RESET_TOKEN_COOKIE)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// verify
// ---------------------------------------------------------------------------

describe("POST /api/auth/forgot-password/verify", () => {
  async function callVerify(body: unknown, cookies: Record<string, string> = {}) {
    const { POST } = await import("./verify/route");
    return POST(makeRequest("http://localhost/api/auth/forgot-password/verify", body, cookies));
  }

  it("returns 401 SESSION_EXPIRED when cookie is missing", async () => {
    const res = await callVerify({ code: "123456" });

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("SESSION_EXPIRED");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rotates the cookie and returns success on valid code", async () => {
    mockFetch.mockResolvedValueOnce(
      backendOk({ reset_token: "tok-verified", expires_in: 1800 }),
    );

    const res = await callVerify(
      { code: "123456" },
      { [RESET_TOKEN_COOKIE]: "tok-unverified" },
    );

    expect(res.status).toBe(200);
    expect(res.cookies.get(RESET_TOKEN_COOKIE)?.value).toBe("tok-verified");
  });

  it("forwards backend errors without leaking the token", async () => {
    mockFetch.mockResolvedValueOnce(backendError(400, "INVALID_CODE"));

    const res = await callVerify(
      { code: "000000" },
      { [RESET_TOKEN_COOKIE]: "tok-unverified" },
    );

    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_CODE");
    expect(res.cookies.get(RESET_TOKEN_COOKIE)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// resend
// ---------------------------------------------------------------------------

describe("POST /api/auth/forgot-password/resend", () => {
  async function callResend(cookies: Record<string, string> = {}) {
    const { POST } = await import("./resend/route");
    return POST(makeRequest("http://localhost/api/auth/forgot-password/resend", {}, cookies));
  }

  it("returns 401 SESSION_EXPIRED when cookie is missing", async () => {
    const res = await callResend();

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("SESSION_EXPIRED");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rotates the cookie on success", async () => {
    mockFetch.mockResolvedValueOnce(
      backendOk({ reset_token: "tok-resent", expires_in: 1800 }),
    );

    const res = await callResend({ [RESET_TOKEN_COOKIE]: "tok-old" });

    expect(res.status).toBe(200);
    expect(res.cookies.get(RESET_TOKEN_COOKIE)?.value).toBe("tok-resent");
  });

  it("preserves 429 errors from the backend", async () => {
    mockFetch.mockResolvedValueOnce(backendError(429, "TOO_MANY_REQUESTS"));

    const res = await callResend({ [RESET_TOKEN_COOKIE]: "tok-old" });

    expect(res.status).toBe(429);
  });
});

// ---------------------------------------------------------------------------
// reset
// ---------------------------------------------------------------------------

describe("POST /api/auth/forgot-password/reset", () => {
  async function callReset(body: unknown, cookies: Record<string, string> = {}) {
    const { POST } = await import("./reset/route");
    return POST(makeRequest("http://localhost/api/auth/forgot-password/reset", body, cookies));
  }

  it("returns 401 SESSION_EXPIRED when cookie is missing", async () => {
    const res = await callReset({ password: "Pass1!", confirm_password: "Pass1!" });

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string } };
    expect(body.error.code).toBe("SESSION_EXPIRED");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("clears the cookie on success", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const res = await callReset(
      { password: "NewPass1!", confirm_password: "NewPass1!" },
      { [RESET_TOKEN_COOKIE]: "tok-verified" },
    );

    expect(res.status).toBe(204);
    expect(res.cookies.get(RESET_TOKEN_COOKIE)?.maxAge).toBe(0);
  });

  it("forwards backend validation errors", async () => {
    mockFetch.mockResolvedValueOnce(backendError(400, "INVALID_TOKEN"));

    const res = await callReset(
      { password: "NewPass1!", confirm_password: "NewPass1!" },
      { [RESET_TOKEN_COOKIE]: "tok-verified" },
    );

    expect(res.status).toBe(400);
  });
});
