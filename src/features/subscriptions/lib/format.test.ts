import { describe, expect, it } from "vitest";
import { formatDate, formatMoney } from "./format";

describe("formatMoney", () => {
  it("groups a numeric amount and appends the currency", () => {
    expect(formatMoney("12000", "EGP")).toBe("12,000 EGP");
  });

  it("treats zero as a finite formatted value", () => {
    expect(formatMoney("0", "EGP")).toBe("0 EGP");
  });

  it("formats an empty amount string as 0 (Number('') === 0)", () => {
    expect(formatMoney("", "EGP")).toBe("0 EGP");
  });

  it("passes through a non-numeric amount unchanged", () => {
    expect(formatMoney("N/A", "EGP")).toBe("N/A EGP");
  });
});

describe("formatDate", () => {
  it("returns a dash for null", () => {
    expect(formatDate(null)).toBe("-");
  });

  it("returns a dash for undefined", () => {
    expect(formatDate(undefined)).toBe("-");
  });

  it("returns a dash for an unparseable date", () => {
    expect(formatDate("not-a-date")).toBe("-");
  });

  it("formats a valid ISO date with the default en locale", () => {
    // Midday UTC avoids timezone date-boundary shifts.
    expect(formatDate("2024-03-15T12:00:00Z")).toBe("Mar 15, 2024");
  });
});
