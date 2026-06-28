import { describe, expect, it } from "vitest";
import { formatRepDate } from "./medical-rep.utils";

describe("formatRepDate", () => {
  it("returns an em-dash for null", () => {
    expect(formatRepDate(null)).toBe("—");
  });

  it("formats an ISO date with the default en-GB locale", () => {
    // Midday UTC avoids timezone date-boundary shifts.
    expect(formatRepDate("2024-03-15T12:00:00Z")).toBe("15 Mar 2024");
  });

  it("respects a provided locale", () => {
    const out = formatRepDate("2024-03-15T12:00:00Z", "en-US");
    expect(out).toContain("Mar");
    expect(out).toContain("2024");
    expect(out).toContain("15");
  });
});
