import { describe, it, expect, vi, afterEach } from "vitest";
import { evaluateFormula } from "./useFormula";

describe("evaluateFormula", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes BMI (numeric)", () => {
    expect(evaluateFormula("weight_kg / ((height_cm / 100) ^ 2)", {
      weight_kg: 60,
      height_cm: 160,
    })).toBe(23.4);
  });

  it("EDD from LMP = LMP + 280 days (matches server)", () => {
    expect(evaluateFormula("edd_from_lmp", { lmp: "2026-01-01" })).toBe(
      "2026-10-08",
    );
  });

  it("GA from LMP is whole weeks+days to today", () => {
    // Pin "today" to LMP + 45 days = 6w 3d.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T09:00:00.000Z"));
    expect(evaluateFormula("ga_from_lmp", { lmp: "2026-01-01" })).toBe("6w 3d");
  });

  it("EDD from US dating accounts for the measured age", () => {
    // Scan 2026-02-01 at 8w0d → EDD = scan + (280-56) = 2026-09-13.
    expect(
      evaluateFormula("edd_from_us", {
        us_dating_date: "2026-02-01",
        us_ga_weeks: 8,
        us_ga_days: 0,
      }),
    ).toBe("2026-09-13");
  });

  it("GA from US advances from the scan to today", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-15T00:00:00.000Z"));
    expect(
      evaluateFormula("ga_from_us", {
        us_dating_date: "2026-02-01",
        us_ga_weeks: 8,
        us_ga_days: 0,
      }),
    ).toBe("10w 0d");
  });

  it("returns null when inputs are missing", () => {
    expect(evaluateFormula("edd_from_lmp", { lmp: "" })).toBeNull();
    expect(evaluateFormula("ga_from_us", { us_dating_date: "2026-02-01" })).toBeNull();
    expect(evaluateFormula("unknown", {})).toBeNull();
  });
});
