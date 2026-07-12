import { beforeEach, describe, expect, it, vi } from "vitest";

const posthogMock = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  group: vi.fn(),
  reset: vi.fn(),
  __loaded: false as boolean,
};

vi.mock("posthog-js", () => ({ default: posthogMock }));

async function loadWith(configured: boolean) {
  vi.resetModules();
  vi.doMock("@/infrastructure/config/analytics-config", () => ({
    analyticsConfigured: configured,
    POSTHOG_KEY: configured ? "phc_test" : "",
    POSTHOG_HOST: "https://us.i.posthog.com",
    POSTHOG_PROXY_PATH: "/api/ingest",
  }));
  return import("./posthog");
}

describe("analytics seam", () => {
  beforeEach(() => {
    posthogMock.init.mockReset();
    posthogMock.capture.mockReset();
    posthogMock.identify.mockReset();
    posthogMock.group.mockReset();
    posthogMock.reset.mockReset();
    posthogMock.__loaded = false;
  });

  it("does nothing when analytics is not configured", async () => {
    const m = await loadWith(false);
    m.initAnalytics();
    m.capture("booking_confirmed", { visitId: "v1" });
    m.identify("u1");
    m.reset();
    expect(posthogMock.init).not.toHaveBeenCalled();
    expect(posthogMock.capture).not.toHaveBeenCalled();
  });

  it("initializes and forwards capture when configured and loaded", async () => {
    const m = await loadWith(true);
    m.initAnalytics();
    expect(posthogMock.init).toHaveBeenCalledOnce();
    posthogMock.__loaded = true;
    m.capture("booking_confirmed", { visitId: "v1" });
    expect(posthogMock.capture).toHaveBeenCalledWith("booking_confirmed", { visitId: "v1" });
  });

  it("resets on logout", async () => {
    const m = await loadWith(true);
    m.initAnalytics();
    posthogMock.__loaded = true;
    m.reset();
    expect(posthogMock.reset).toHaveBeenCalledOnce();
  });
});
