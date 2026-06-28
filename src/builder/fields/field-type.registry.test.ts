import { describe, expect, it } from "vitest";
import { FIELD_TYPE_ALLOWED_NAMESPACES } from "./field-type.registry";
import type { BindingNamespace, FormFieldType } from "../templates/template.types";

const ALL_NS: BindingNamespace[] = [
  "PATIENT",
  "VISIT",
  "INTAKE",
  "GUARDIAN",
  "MEDICAL_REP",
  "LOOKUP",
  "SYSTEM",
  "COMPUTED",
];

const ALL_TYPES: FormFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "DECIMAL",
  "DATE",
  "DATETIME",
  "BOOLEAN",
  "SELECT",
  "MULTISELECT",
  "ENTITY_SEARCH",
  "COMPUTED",
];

describe("FIELD_TYPE_ALLOWED_NAMESPACES", () => {
  it("defines an allowlist for every field type", () => {
    for (const type of ALL_TYPES) {
      expect(FIELD_TYPE_ALLOWED_NAMESPACES[type]).toBeInstanceOf(Set);
    }
    expect(Object.keys(FIELD_TYPE_ALLOWED_NAMESPACES).sort()).toEqual(
      [...ALL_TYPES].sort(),
    );
  });

  it("lets generic input types bind to any namespace", () => {
    const generic: FormFieldType[] = [
      "TEXT",
      "TEXTAREA",
      "NUMBER",
      "DECIMAL",
      "DATE",
      "DATETIME",
      "BOOLEAN",
      "SELECT",
      "MULTISELECT",
    ];
    for (const type of generic) {
      const set = FIELD_TYPE_ALLOWED_NAMESPACES[type];
      expect(set.size).toBe(ALL_NS.length);
      for (const ns of ALL_NS) {
        expect(set.has(ns)).toBe(true);
      }
    }
  });

  it("restricts ENTITY_SEARCH to LOOKUP, VISIT and MEDICAL_REP", () => {
    const set = FIELD_TYPE_ALLOWED_NAMESPACES.ENTITY_SEARCH;
    expect([...set].sort()).toEqual(["LOOKUP", "MEDICAL_REP", "VISIT"]);
    expect(set.has("PATIENT")).toBe(false);
    expect(set.has("COMPUTED")).toBe(false);
  });

  it("restricts COMPUTED to the COMPUTED namespace only", () => {
    const set = FIELD_TYPE_ALLOWED_NAMESPACES.COMPUTED;
    expect([...set]).toEqual(["COMPUTED"]);
    expect(set.has("PATIENT")).toBe(false);
  });
});
