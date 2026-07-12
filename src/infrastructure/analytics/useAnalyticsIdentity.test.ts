import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./posthog", () => ({ identify: vi.fn(), group: vi.fn(), reset: vi.fn() }));

import { group, identify, reset } from "./posthog";
import { useAnalyticsIdentity } from "./useAnalyticsIdentity";

const ctx = (over: object) => ({
  user: null,
  profile: null,
  orgId: null,
  branchId: null,
  ...over,
});

describe("useAnalyticsIdentity", () => {
  it("identifies and groups when a user is present", () => {
    renderHook(() =>
      useAnalyticsIdentity(
        ctx({ user: { id: "u1", email: "x" }, orgId: "o1", branchId: "b1" }) as never,
      ),
    );
    expect(identify).toHaveBeenCalledWith("u1");
    expect(group).toHaveBeenCalledWith("organization", "o1");
    expect(group).toHaveBeenCalledWith("branch", "b1");
  });

  it("resets when the user becomes anonymous", () => {
    const { rerender } = renderHook(({ c }) => useAnalyticsIdentity(c as never), {
      initialProps: { c: ctx({ user: { id: "u1", email: "x" } }) },
    });
    vi.mocked(reset).mockClear();
    rerender({ c: ctx({ user: null }) });
    expect(reset).toHaveBeenCalledOnce();
  });
});
