import { describe, expect, it } from "vitest";
import { formatSettingsDateTime } from "./settings.utils";

describe("settings utils", () => {
  it("formats timestamps with localized date and time", () => {
    const value = "2026-01-01T00:00:00.000Z";
    const expected = new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));

    expect(formatSettingsDateTime(value, "en")).toBe(expected);
  });

  it("returns a fallback for missing and invalid timestamps", () => {
    expect(formatSettingsDateTime(null, "en")).toBe("-");
    expect(formatSettingsDateTime(undefined, "en")).toBe("-");
    expect(formatSettingsDateTime("not-a-date", "en")).toBe("-");
  });

  it("formats Arabic timestamps without falling back", () => {
    expect(formatSettingsDateTime("2026-01-01T00:00:00.000Z", "ar")).not.toBe(
      "-",
    );
  });
});
