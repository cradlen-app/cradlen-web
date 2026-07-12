import { afterEach, describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  return import("./analytics-config");
}

describe("analytics-config", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is not configured when no key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "");
    const m = await load();
    expect(m.analyticsConfigured).toBe(false);
  });

  it("is configured and defaults host to US cloud when a key is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_KEY", "phc_test");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", "");
    const m = await load();
    expect(m.analyticsConfigured).toBe(true);
    expect(m.POSTHOG_HOST).toBe("https://us.i.posthog.com");
  });
});
