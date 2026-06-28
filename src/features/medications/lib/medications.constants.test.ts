import { describe, expect, it } from "vitest";
import {
  MEDICATION_CATEGORY_OPTIONS,
  MEDICATION_FORM_OPTIONS,
  MEDICATION_STRENGTH_OPTIONS,
} from "./medications.constants";

describe("medication option constants", () => {
  it("category options are non-empty, unique, and include an Other catch-all", () => {
    expect(MEDICATION_CATEGORY_OPTIONS.length).toBeGreaterThan(0);
    expect(new Set(MEDICATION_CATEGORY_OPTIONS).size).toBe(
      MEDICATION_CATEGORY_OPTIONS.length,
    );
    expect(MEDICATION_CATEGORY_OPTIONS).toContain("Other");
  });

  it("form options are non-empty and unique", () => {
    expect(MEDICATION_FORM_OPTIONS.length).toBeGreaterThan(0);
    expect(new Set(MEDICATION_FORM_OPTIONS).size).toBe(
      MEDICATION_FORM_OPTIONS.length,
    );
    expect(MEDICATION_FORM_OPTIONS).toContain("Tablet");
  });

  it("strength options are non-empty and unique", () => {
    expect(MEDICATION_STRENGTH_OPTIONS.length).toBeGreaterThan(0);
    expect(new Set(MEDICATION_STRENGTH_OPTIONS).size).toBe(
      MEDICATION_STRENGTH_OPTIONS.length,
    );
    expect(MEDICATION_STRENGTH_OPTIONS).toContain("500mg");
  });
});
