import { describe, expect, it } from "vitest";
import { ApiError } from "@/common/errors/api-error";
import { isEncounterLocked } from "./encounter-errors";

function lockedError(body: unknown, status = 409) {
  return new ApiError(status, "Visit is closed", body);
}

describe("isEncounterLocked", () => {
  it("is false for non-ApiError values", () => {
    expect(isEncounterLocked(new Error("boom"))).toBe(false);
    expect(isEncounterLocked(null)).toBe(false);
    expect(isEncounterLocked("ENCOUNTER_LOCKED")).toBe(false);
    expect(isEncounterLocked(undefined)).toBe(false);
  });

  it("is false when the status is not 409", () => {
    expect(isEncounterLocked(lockedError({ code: "ENCOUNTER_LOCKED" }, 403))).toBe(
      false,
    );
  });

  it("is false for a 409 carrying a different code", () => {
    expect(isEncounterLocked(lockedError({ code: "VERSION_CONFLICT" }))).toBe(
      false,
    );
    expect(isEncounterLocked(lockedError(null))).toBe(false);
    expect(isEncounterLocked(lockedError(undefined))).toBe(false);
  });

  // GlobalExceptionFilter wraps bodies; some responses arrive flat.
  it("is true for the nested { error: { code } } shape", () => {
    expect(
      isEncounterLocked(lockedError({ error: { code: "ENCOUNTER_LOCKED" } })),
    ).toBe(true);
  });

  it("is true for the flat { code } shape", () => {
    expect(isEncounterLocked(lockedError({ code: "ENCOUNTER_LOCKED" }))).toBe(
      true,
    );
  });
});
