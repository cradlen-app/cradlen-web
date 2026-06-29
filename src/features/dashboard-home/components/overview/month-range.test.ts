import { afterEach, describe, expect, it, vi } from "vitest";
import { currentMonthRange, previousMonthRange } from "./month-range";

afterEach(() => {
  vi.useRealTimers();
});

function freeze(d: Date) {
  vi.useFakeTimers();
  vi.setSystemTime(d);
}

describe("currentMonthRange", () => {
  it("spans the 1st of the current month through today (local)", () => {
    freeze(new Date(2024, 5, 15, 9, 30)); // 15 Jun 2024
    expect(currentMonthRange()).toEqual({
      date_from: "2024-06-01",
      date_to: "2024-06-15",
    });
  });

  it("collapses to a single day on the 1st of the month", () => {
    freeze(new Date(2024, 0, 1, 0, 5));
    expect(currentMonthRange()).toEqual({
      date_from: "2024-01-01",
      date_to: "2024-01-01",
    });
  });

  it("zero-pads months and days", () => {
    freeze(new Date(2024, 2, 5, 12)); // 5 Mar 2024
    expect(currentMonthRange()).toEqual({
      date_from: "2024-03-01",
      date_to: "2024-03-05",
    });
  });
});

describe("previousMonthRange", () => {
  it("covers the whole previous calendar month", () => {
    freeze(new Date(2024, 5, 15)); // June => previous is May (31 days)
    expect(previousMonthRange()).toEqual({
      date_from: "2024-05-01",
      date_to: "2024-05-31",
    });
  });

  it("rolls back across the year boundary from January to December", () => {
    freeze(new Date(2024, 0, 10)); // Jan 2024 => Dec 2023
    expect(previousMonthRange()).toEqual({
      date_from: "2023-12-01",
      date_to: "2023-12-31",
    });
  });

  it("computes the correct last day for a leap-year February", () => {
    freeze(new Date(2024, 2, 20)); // March 2024 => Feb 2024 (29 days)
    expect(previousMonthRange()).toEqual({
      date_from: "2024-02-01",
      date_to: "2024-02-29",
    });
  });

  it("computes the correct last day for a non-leap February", () => {
    freeze(new Date(2023, 2, 20)); // March 2023 => Feb 2023 (28 days)
    expect(previousMonthRange()).toEqual({
      date_from: "2023-02-01",
      date_to: "2023-02-28",
    });
  });
});
