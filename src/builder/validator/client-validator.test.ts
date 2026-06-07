import { describe, expect, it } from "vitest";
import {
  mapServerFieldErrors,
  mapServerMessageErrors,
  validateTemplate,
} from "./client-validator";
import type { FormTemplateDto } from "../templates/template.types";

const template: FormTemplateDto = {
  id: "tpl",
  code: "book_visit",
  name: "OB",
  description: null,
  scope: "BOOK_VISIT",
  version: 1,
  activated_at: null,
  specialty_id: null,
  sections: [
    {
      id: "s",
      code: "patient_info",
      name: "Patient info",
      order: 0,
      config: {
        logic: {
          predicates: [
            { effect: "visible", when: { eq: { visitor_type: "PATIENT" } } },
          ],
        },
      },
      fields: [
        {
          id: "f1",
          code: "full_name",
          label: "Full name",
          type: "TEXT",
          order: 0,
          required: true,
          binding: { namespace: "PATIENT", path: "full_name" },
          config: { validation: { minLength: 2, maxLength: 200 } },
        },
        {
          id: "f2",
          code: "national_id",
          label: "National ID",
          type: "TEXT",
          order: 1,
          required: false,
          binding: { namespace: "PATIENT", path: "national_id" },
          config: {
            validation: { minLength: 8, maxLength: 20, pattern: "^[0-9]{8,20}$" },
          },
        },
        {
          id: "f3",
          code: "date_of_birth",
          label: "Date of birth",
          type: "DATE",
          order: 2,
          required: false,
          binding: { namespace: "PATIENT", path: "date_of_birth" },
          config: { validation: { notInFuture: true, maxAgeYears: 120 } },
        },
      ],
    },
  ],
};

const PATIENT = { visitor_type: "PATIENT" };

describe("validateTemplate — required", () => {
  it("flags required field when empty", () => {
    const errors = validateTemplate(template, {
      systemValues: PATIENT,
      formValues: {},
      searchState: {},
    });
    expect(errors.full_name).toBeDefined();
  });

  it("skips fields in hidden sections", () => {
    const errors = validateTemplate(template, {
      systemValues: { visitor_type: "MEDICAL_REP" },
      formValues: {},
      searchState: {},
    });
    expect(errors).toEqual({});
  });
});

describe("validateTemplate — config.validation constraints", () => {
  function run(formValues: Record<string, unknown>) {
    return validateTemplate(template, {
      systemValues: PATIENT,
      formValues: { full_name: "Aisha", ...formValues },
      searchState: {},
    });
  }

  it("passes when all present values are valid", () => {
    const errors = run({ national_id: "12345678", date_of_birth: "1990-01-01" });
    expect(errors).toEqual({});
  });

  it("flags an invalid-format national_id (non-digits)", () => {
    const errors = run({ national_id: "abcdefgh" });
    expect(errors.national_id).toContain("invalid format");
  });

  it("flags a too-short national_id", () => {
    const errors = run({ national_id: "123" });
    expect(errors.national_id).toContain("at least 8");
  });

  it("flags a too-short full_name (minLength 2)", () => {
    const errors = validateTemplate(template, {
      systemValues: PATIENT,
      formValues: { full_name: "A" },
      searchState: {},
    });
    expect(errors.full_name).toContain("at least 2");
  });

  it("flags a future date_of_birth", () => {
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const errors = run({ date_of_birth: tomorrow });
    expect(errors.date_of_birth).toContain("future");
  });

  it("flags a date_of_birth older than maxAgeYears", () => {
    const errors = run({ date_of_birth: "1800-01-01" });
    expect(errors.date_of_birth).toContain("maximum allowed age");
  });
});

describe("mapServerFieldErrors", () => {
  it("maps binding paths back to field codes", () => {
    const errors = mapServerFieldErrors(template, {
      full_name: ["is required"],
      national_id: "bad",
    });
    expect(errors).toEqual({ full_name: "is required", national_id: "bad" });
  });
});

describe("mapServerMessageErrors", () => {
  it("maps '<code> <message>' strings back to field codes", () => {
    const errors = mapServerMessageErrors(template, [
      "national_id has an invalid format",
    ]);
    expect(errors).toEqual({ national_id: "has an invalid format" });
  });

  it("ignores unknown field codes", () => {
    const errors = mapServerMessageErrors(template, ["unknown_field is bad"]);
    expect(errors).toEqual({});
  });
});
