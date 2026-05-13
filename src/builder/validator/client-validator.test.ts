import { describe, expect, it } from "vitest";
import { mapServerFieldErrors, validateTemplate } from "./client-validator";
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
          config: {},
        },
        {
          id: "f2",
          code: "spouse_full_name",
          label: "Spouse full name",
          type: "TEXT",
          order: 1,
          required: false,
          binding: { namespace: "GUARDIAN", path: "full_name" },
          config: {
            logic: {
              predicates: [
                {
                  effect: "required",
                  when: { eq: { marital_status: "MARRIED" } },
                  message: "Spouse required when married",
                },
                {
                  effect: "forbidden",
                  when: { eq: { marital_status: "SINGLE" } },
                  message: "Spouse not allowed when single",
                },
              ],
            },
          },
        },
      ],
    },
  ],
};

describe("validateTemplate", () => {
  it("flags required field when empty", () => {
    const errors = validateTemplate(template, {
      systemValues: { visitor_type: "PATIENT" },
      formValues: {},
      searchState: {},
    });
    expect(errors.full_name).toBeDefined();
  });

  it("flags required-by-predicate when matching", () => {
    const errors = validateTemplate(template, {
      systemValues: { visitor_type: "PATIENT" },
      formValues: { full_name: "Aisha", marital_status: "MARRIED" },
      searchState: {},
    });
    expect(errors.spouse_full_name).toBe("Spouse required when married");
  });

  it("flags forbidden field when non-empty", () => {
    const errors = validateTemplate(template, {
      systemValues: { visitor_type: "PATIENT" },
      formValues: {
        full_name: "Aisha",
        marital_status: "SINGLE",
        spouse_full_name: "Omar",
      },
      searchState: {},
    });
    expect(errors.spouse_full_name).toBe("Spouse not allowed when single");
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

describe("mapServerFieldErrors", () => {
  it("maps binding paths back to field codes (including spouse_)", () => {
    const errors = mapServerFieldErrors(template, {
      full_name: ["is required"],
      spouse_full_name: "not allowed",
    });
    expect(errors).toEqual({
      full_name: "is required",
      spouse_full_name: "not allowed",
    });
  });
});
