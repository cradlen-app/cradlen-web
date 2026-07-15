import { afterEach, describe, expect, it, vi } from "vitest";
import { API_BASE_URL, backendUrl, sanitizeBackendError } from "./backend";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("backendUrl — path safety", () => {
  it("passes a normal nested path through unchanged", () => {
    expect(backendUrl("/patients/abc/visits")).toBe(
      `${API_BASE_URL}/patients/abc/visits`,
    );
  });

  it("inserts a leading slash when missing", () => {
    expect(backendUrl("patients")).toBe(`${API_BASE_URL}/patients`);
  });

  it("leaves the query string untouched", () => {
    expect(backendUrl("/patients?page=1&limit=10")).toBe(
      `${API_BASE_URL}/patients?page=1&limit=10`,
    );
  });

  it("rejects a `..` path segment (traversal)", () => {
    expect(() => backendUrl("/patients/../admin")).toThrow(/unsafe/i);
  });

  it("rejects a protocol-relative target", () => {
    expect(() => backendUrl("//evil.com/steal")).toThrow(/unsafe/i);
  });

  it("rejects a smuggled absolute URL", () => {
    expect(() => backendUrl("/https://evil.com/steal")).toThrow(/unsafe/i);
  });

  it("does not false-positive on `..` inside the query string", () => {
    expect(() => backendUrl("/patients?q=..")).not.toThrow();
  });
});

describe("API base URL validation (production)", () => {
  async function loadWith(env: Record<string, string>) {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value);
    }
    return import("./backend");
  }

  it("accepts the canonical https cradlen host", async () => {
    const mod = await loadWith({ API_BASE_URL: "https://api.cradlen.com/v1" });
    expect(mod.API_BASE_URL).toBe("https://api.cradlen.com/v1");
  });

  it("accepts any *.cradlen.com subdomain over https", async () => {
    const mod = await loadWith({
      API_BASE_URL: "https://staging-api.cradlen.com/v1",
    });
    expect(mod.API_BASE_URL).toBe("https://staging-api.cradlen.com/v1");
  });

  it("rejects an http base in production (token exfil risk)", async () => {
    await expect(
      loadWith({ API_BASE_URL: "http://api.cradlen.com/v1" }),
    ).rejects.toThrow(/https/i);
  });

  it("rejects a non-cradlen host in production", async () => {
    await expect(
      loadWith({ API_BASE_URL: "https://evil.com/v1" }),
    ).rejects.toThrow(/untrusted/i);
  });
});

describe("sanitizeBackendError", () => {
  it("collapses any 5xx body to a generic message", () => {
    expect(
      sanitizeBackendError(
        { message: "DB host db-01 timeout", stack: "at line 42" },
        500,
      ),
    ).toEqual({ message: "Something went wrong. Please try again." });
  });

  it("preserves a safe 4xx message (login stays readable)", () => {
    expect(
      sanitizeBackendError({ message: "Invalid credentials" }, 401),
    ).toEqual({ message: "Invalid credentials" });
  });

  it("keeps validation errors as {field,message} only, dropping extras", () => {
    expect(
      sanitizeBackendError(
        {
          message: "Validation failed",
          errors: [{ field: "email", message: "bad", internalCode: 7 }],
          trace: "secret",
        },
        422,
      ),
    ).toEqual({
      message: "Validation failed",
      errors: [{ field: "email", message: "bad" }],
    });
  });

  it("passes through the API error contract's code and details on 4xx", () => {
    expect(
      sanitizeBackendError(
        {
          error: {
            code: "SUBSCRIPTION_LIMIT_REACHED",
            message: "This plan does not fit your current usage",
            statusCode: 403,
            details: {
              reason: "PLAN_CHANGE_OVER_LIMIT",
              over: [
                { resource: "branches", limit: 1, current: 2, excess: 1 },
              ],
              suggested_add_ons: [
                {
                  code: "center_extra_branch",
                  quantity: 1,
                  resource: "branches",
                },
              ],
            },
            requestId: "internal-trace-id",
          },
        },
        403,
      ),
    ).toEqual({
      message: "This plan does not fit your current usage",
      code: "SUBSCRIPTION_LIMIT_REACHED",
      details: {
        reason: "PLAN_CHANGE_OVER_LIMIT",
        over: [{ resource: "branches", limit: 1, current: 2, excess: 1 }],
        suggested_add_ons: [
          { code: "center_extra_branch", quantity: 1, resource: "branches" },
        ],
      },
    });
  });

  it("drops non-string code and non-object details", () => {
    expect(
      sanitizeBackendError(
        { message: "Bad", code: 42, details: ["not", "an", "object"] },
        400,
      ),
    ).toEqual({ message: "Bad" });
  });

  it("falls back to detail, then a generic message, for 4xx", () => {
    expect(sanitizeBackendError({ detail: "Nope" }, 400)).toEqual({
      message: "Nope",
    });
    expect(sanitizeBackendError("raw internal text", 400)).toEqual({
      message: "Request failed.",
    });
    expect(sanitizeBackendError({ internalOnly: true }, 400)).toEqual({
      message: "Request failed.",
    });
  });
});
