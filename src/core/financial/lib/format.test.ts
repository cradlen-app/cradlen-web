import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateLong,
  formatMoney,
  formatPercent,
  personName,
} from "./format";

describe("formatMoney", () => {
  it("formats with the supplied currency code and two decimals", () => {
    expect(formatMoney(1234.5, "USD")).toBe("USD 1,234.50");
  });

  it("defaults to EGP when no currency is passed", () => {
    expect(formatMoney(10)).toBe("EGP 10.00");
  });

  it("falls back to EGP when currency is null or undefined", () => {
    expect(formatMoney(10, null)).toBe("EGP 10.00");
    expect(formatMoney(10, undefined)).toBe("EGP 10.00");
  });

  it("rounds to two fraction digits and groups thousands", () => {
    expect(formatMoney(1000000, "EGP")).toBe("EGP 1,000,000.00");
    expect(formatMoney(0, "EGP")).toBe("EGP 0.00");
  });
});

describe("formatPercent", () => {
  it("formats with a single fraction digit and percent sign", () => {
    expect(formatPercent(42.5)).toBe("42.5%");
  });

  it("pads whole numbers to one decimal place", () => {
    expect(formatPercent(100)).toBe("100.0%");
    expect(formatPercent(0)).toBe("0.0%");
  });
});

describe("formatDate", () => {
  it("returns em dash for null/undefined/empty", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("")).toBe("—");
  });

  it("returns em dash for an unparseable date", () => {
    expect(formatDate("not-a-date")).toBe("—");
  });

  it("formats a valid ISO date string", () => {
    const out = formatDate("2026-06-12T00:00:00.000Z");
    expect(out).not.toBe("—");
    expect(out).toBe(new Date("2026-06-12T00:00:00.000Z").toLocaleDateString());
  });
});

describe("formatDateLong", () => {
  it("returns em dash for null/undefined/invalid", () => {
    expect(formatDateLong(null)).toBe("—");
    expect(formatDateLong(undefined)).toBe("—");
    expect(formatDateLong("nope")).toBe("—");
  });

  it("formats a valid date as a medium en-US date", () => {
    expect(formatDateLong("2026-06-12T12:00:00.000Z")).toBe("Jun 12, 2026");
  });
});

describe("personName", () => {
  it("returns the fallback when person is null/undefined", () => {
    expect(personName(null, "uuid-1")).toBe("uuid-1");
    expect(personName(undefined, "uuid-1")).toBe("uuid-1");
  });

  it("prefers full_name when present", () => {
    expect(
      personName({ full_name: "Mona Said", first_name: "X", last_name: "Y" }, "fb"),
    ).toBe("Mona Said");
  });

  it("composes first + last when no full_name", () => {
    expect(personName({ first_name: "Mona", last_name: "Said" }, "fb")).toBe(
      "Mona Said",
    );
  });

  it("uses just the available name part", () => {
    expect(personName({ first_name: "Mona" }, "fb")).toBe("Mona");
    expect(personName({ last_name: "Said" }, "fb")).toBe("Said");
  });

  it("falls back when all name parts are blank/missing", () => {
    expect(personName({ full_name: null, first_name: null, last_name: null }, "fb")).toBe(
      "fb",
    );
    expect(personName({}, "fb")).toBe("fb");
  });
});
