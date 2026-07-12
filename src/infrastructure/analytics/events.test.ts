import { describe, expect, it } from "vitest";
import { ANALYTICS_EVENT_NAMES, isAnalyticsEventName } from "./events";

describe("analytics events", () => {
  it("exposes the v1 funnel event names", () => {
    expect(ANALYTICS_EVENT_NAMES).toContain("booking_confirmed");
    expect(ANALYTICS_EVENT_NAMES).toContain("signup_completed");
  });

  it("recognizes known names and rejects unknown ones", () => {
    expect(isAnalyticsEventName("visit_started")).toBe(true);
    expect(isAnalyticsEventName("patient_national_id")).toBe(false);
  });
});
