import { afterEach, describe, expect, it, vi } from "vitest";
import { formatRelativeTime } from "./utils";

const NOW = new Date(2024, 5, 15, 12, 0, 0); // local time anchor

afterEach(() => {
  vi.useRealTimers();
});

function freezeNow() {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
}

function ago(ms: number): string {
  return new Date(NOW.getTime() - ms).toISOString();
}

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("returns an empty string for an unparseable date", () => {
    expect(formatRelativeTime("not-a-date", "en")).toBe("");
  });

  it("renders sub-minute differences as '0 seconds' (numeric: always)", () => {
    freezeNow();
    const out = formatRelativeTime(ago(30_000), "en");
    expect(out).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(
        0,
        "second",
      ),
    );
  });

  it("renders minute-scale differences", () => {
    freezeNow();
    const out = formatRelativeTime(ago(5 * MIN), "en");
    expect(out).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        -5,
        "minute",
      ),
    );
  });

  it("renders hour-scale differences", () => {
    freezeNow();
    const out = formatRelativeTime(ago(3 * HOUR), "en");
    expect(out).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-3, "hour"),
    );
  });

  it("renders day-scale differences", () => {
    freezeNow();
    const out = formatRelativeTime(ago(2 * DAY), "en");
    expect(out).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-2, "day"),
    );
  });

  it("crosses the 60-minute boundary into hours", () => {
    freezeNow();
    // 59 min => minutes; 60 min => 1 hour.
    expect(formatRelativeTime(ago(59 * MIN), "en")).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        -59,
        "minute",
      ),
    );
    expect(formatRelativeTime(ago(60 * MIN), "en")).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-1, "hour"),
    );
  });

  it("crosses the 24-hour boundary into days", () => {
    freezeNow();
    expect(formatRelativeTime(ago(23 * HOUR), "en")).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
        -23,
        "hour",
      ),
    );
    expect(formatRelativeTime(ago(24 * HOUR), "en")).toBe(
      new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(-1, "day"),
    );
  });

  it("honors the requested locale (Arabic)", () => {
    freezeNow();
    const out = formatRelativeTime(ago(2 * HOUR), "ar");
    expect(out).toBe(
      new Intl.RelativeTimeFormat("ar", { numeric: "auto" }).format(-2, "hour"),
    );
  });
});
