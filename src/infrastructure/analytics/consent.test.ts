import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("posthog-js", () => ({
  default: { opt_in_capturing: vi.fn(), opt_out_capturing: vi.fn(), __loaded: true },
}));
vi.mock("@/infrastructure/config/analytics-config", () => ({ analyticsConfigured: true }));

describe("analytics consent", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("returns null before any choice", async () => {
    const m = await import("./consent");
    expect(m.getConsent()).toBeNull();
  });

  it("persists a granted choice and opts in", async () => {
    const posthog = (await import("posthog-js")).default;
    const m = await import("./consent");
    m.setConsent("granted");
    expect(m.getConsent()).toBe("granted");
    expect(posthog.opt_in_capturing).toHaveBeenCalledOnce();
  });

  it("persists a denied choice and opts out", async () => {
    const posthog = (await import("posthog-js")).default;
    const m = await import("./consent");
    m.setConsent("denied");
    expect(m.getConsent()).toBe("denied");
    expect(posthog.opt_out_capturing).toHaveBeenCalledOnce();
  });
});
