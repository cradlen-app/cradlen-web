import { describe, expect, it } from "vitest";
import { ApiError } from "@/infrastructure/http/api";
import {
  getSubscriptionLimit,
  isSubscriptionExpired,
} from "@/common/errors/subscription-errors";

describe("getSubscriptionLimit", () => {
  it("returns null for non-ApiError values", () => {
    expect(getSubscriptionLimit(new Error("nope"))).toBeNull();
    expect(getSubscriptionLimit(null)).toBeNull();
    expect(getSubscriptionLimit("string error")).toBeNull();
  });

  it("returns null for non-403 ApiErrors", () => {
    const err = new ApiError(400, "bad request", {
      code: "SUBSCRIPTION_LIMIT_REACHED",
      details: { resource: "branches", limit: 1, current: 1 },
    });
    expect(getSubscriptionLimit(err)).toBeNull();
  });

  it("returns null when 403 body lacks the SUBSCRIPTION_LIMIT_REACHED code", () => {
    const err = new ApiError(403, "forbidden", { message: "forbidden" });
    expect(getSubscriptionLimit(err)).toBeNull();
  });

  it("returns details for a matching 403", () => {
    const err = new ApiError(403, "Branch limit reached", {
      code: "SUBSCRIPTION_LIMIT_REACHED",
      details: { resource: "branches", limit: 1, current: 1 },
    });
    expect(getSubscriptionLimit(err)).toEqual({
      resource: "branches",
      limit: 1,
      current: 1,
    });
  });

  it("returns details for a 403 with nested error.code (GlobalExceptionFilter shape)", () => {
    const err = new ApiError(403, "Branch limit reached", {
      error: {
        code: "SUBSCRIPTION_LIMIT_REACHED",
        details: { resource: "branches", limit: 3, current: 3 },
      },
    });
    expect(getSubscriptionLimit(err)).toEqual({
      resource: "branches",
      limit: 3,
      current: 3,
    });
  });
});

describe("isSubscriptionExpired", () => {
  it("is false for non-ApiError / non-403", () => {
    expect(isSubscriptionExpired(new Error("nope"))).toBe(false);
    expect(
      isSubscriptionExpired(new ApiError(400, "bad", { code: "SUBSCRIPTION_EXPIRED" })),
    ).toBe(false);
  });

  it("is true for a 403 with top-level code", () => {
    const err = new ApiError(403, "expired", { code: "SUBSCRIPTION_EXPIRED" });
    expect(isSubscriptionExpired(err)).toBe(true);
  });

  it("is true for a 403 with nested error.code (GlobalExceptionFilter shape)", () => {
    const err = new ApiError(403, "expired", {
      error: { code: "SUBSCRIPTION_EXPIRED", message: "x" },
    });
    expect(isSubscriptionExpired(err)).toBe(true);
  });

  it("is false for a different 403 code", () => {
    const err = new ApiError(403, "forbidden", { code: "FORBIDDEN" });
    expect(isSubscriptionExpired(err)).toBe(false);
  });
});
