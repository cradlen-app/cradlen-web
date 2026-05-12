import { describe, expect, it } from "vitest";
import { ApiError } from "@/infrastructure/http/api";
import { getSubscriptionLimit } from "@/common/errors/subscription-errors";

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
});
