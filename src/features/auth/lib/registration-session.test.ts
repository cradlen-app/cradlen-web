import { beforeEach, describe, expect, it } from "vitest";
import {
  clearPendingSignupSession,
  extractSignupToken,
  clearPendingSignupEmail,
  getPendingSignupEmail,
  normalizeSignupEmail,
  setPendingSignupEmail,
} from "./registration-session";

describe("pending signup email storage", () => {
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
      },
    });
  });

  it("normalizes signup emails", () => {
    expect(normalizeSignupEmail("  Person@Example.COM ")).toBe(
      "person@example.com",
    );
  });

  it("stores and clears the pending signup email", () => {
    setPendingSignupEmail("  Person@Example.COM ");

    expect(getPendingSignupEmail()).toBe("person@example.com");

    clearPendingSignupEmail();

    expect(getPendingSignupEmail()).toBeNull();
  });

  it("extracts signup tokens from wrapped or root responses", () => {
    expect(extractSignupToken({ data: { signup_token: "token-1" } })).toBe(
      "token-1",
    );
    expect(extractSignupToken({ registration_token: "token-2" })).toBe(
      "token-2",
    );
    expect(extractSignupToken({ data: { signup_token: " " } })).toBeNull();
  });

  it("clears the full pending signup session", () => {
    setPendingSignupEmail("person@example.com");

    clearPendingSignupSession();

    expect(getPendingSignupEmail()).toBeNull();
  });
});
