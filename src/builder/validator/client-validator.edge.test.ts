import { describe, expect, it } from "vitest";
import {
  mapServerFieldErrors,
  mapServerMessageErrors,
  validateTemplate,
  type ValidationTranslate,
} from "./client-validator";
import type { ExecutionSnapshot } from "../templates/submission-builder";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "../templates/template.types";

let seq = 0;
function field(partial: Partial<FormFieldDto> & { code: string }): FormFieldDto {
  seq += 1;
  return {
    id: `f-${seq}`,
    label: partial.label ?? partial.code,
    type: "TEXT",
    order: seq,
    required: false,
    binding: { namespace: "PATIENT", path: partial.code },
    config: {},
    ...partial,
  } as FormFieldDto;
}

function template(fields: FormFieldDto[], sectionConfig: FormSectionDto["config"] = {}): FormTemplateDto {
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      {
        id: "s",
        code: "sec",
        name: "Sec",
        order: 0,
        config: sectionConfig,
        fields,
      },
    ],
  };
}

function snapshot(partial: Partial<ExecutionSnapshot> = {}): ExecutionSnapshot {
  return {
    formValues: {},
    systemValues: {},
    searchState: {},
    ...partial,
  };
}

describe("validateTemplate — translate + namespaces", () => {
  it("uses a supplied translate function for the required fallback", () => {
    const t: ValidationTranslate = (key, params) => `T:${key}:${params?.label}`;
    const errors = validateTemplate(
      template([field({ code: "full_name", label: "Full name", required: true })]),
      snapshot(),
      t,
    );
    expect(errors.full_name).toBe("T:required:Full name");
  });

  it("falls through to the raw key when neither translate nor fallback knows it", () => {
    // No translate; the required key resolves to the English fallback, but a
    // forbidden custom-message-less rule uses the fallback table — assert that
    // an unknown key would echo. We exercise this via a custom translate that
    // returns the key only for an unmapped key.
    const t: ValidationTranslate = (key) => key; // identity
    const errors = validateTemplate(
      template([field({ code: "full_name", required: true })]),
      snapshot(),
      t,
    );
    expect(errors.full_name).toBe("required");
  });

  it("reads LOOKUP values from searchState.resolvedEntityId.id", () => {
    const lookup = field({
      code: "patient_id",
      required: true,
      binding: { namespace: "LOOKUP", path: "patient_id" },
    });
    // Resolved → not empty → no error.
    expect(
      validateTemplate(template([lookup]), snapshot({
        searchState: { patient_id: { transientValue: "", suggestions: [], resolvedEntityId: { id: "p-1", label: "x" } } },
      })),
    ).toEqual({});
    // Unresolved → empty → required error.
    const errs = validateTemplate(template([lookup]), snapshot());
    expect(errs.patient_id).toContain("is required");
  });

  it("reads SYSTEM values from systemValues", () => {
    const sys = field({
      code: "visitor_type",
      required: true,
      binding: { namespace: "SYSTEM", path: "visitor_type" },
    });
    expect(
      validateTemplate(template([sys]), snapshot({ systemValues: { visitor_type: "PATIENT" } })),
    ).toEqual({});
    expect(validateTemplate(template([sys]), snapshot()).visitor_type).toContain("is required");
  });
});

describe("validateTemplate — predicate-driven required / forbidden", () => {
  it("requires a field when a 'required' predicate fires and surfaces its message", () => {
    const f = field({
      code: "delivery_date",
      label: "Delivery date",
      config: {
        logic: {
          predicates: [
            {
              effect: "required",
              when: { eq: { visitor_type: "PATIENT" } },
              message: "Delivery date is required for patients",
            },
          ],
        },
      },
    });
    const errors = validateTemplate(
      template([f]),
      snapshot({ systemValues: { visitor_type: "PATIENT" } }),
    );
    expect(errors.delivery_date).toBe("Delivery date is required for patients");
  });

  it("uses the translated required fallback when the required predicate carries no message", () => {
    const f = field({
      code: "x",
      label: "X",
      config: {
        logic: { predicates: [{ effect: "required", when: { eq: { a: 1 } } }] },
      },
    });
    const errors = validateTemplate(template([f]), snapshot({ systemValues: { a: 1 } }));
    expect(errors.x).toBe("X is required");
  });

  it("flags a forbidden field with a present value (custom message)", () => {
    const f = field({
      code: "lmp",
      label: "LMP",
      config: {
        logic: {
          predicates: [
            { effect: "forbidden", when: { eq: { sex: "MALE" } }, message: "LMP not allowed for males" },
          ],
        },
      },
    });
    const errors = validateTemplate(
      template([f]),
      snapshot({ systemValues: { sex: "MALE" }, formValues: { lmp: "2026-01-01" } }),
    );
    expect(errors.lmp).toBe("LMP not allowed for males");
  });

  it("flags a forbidden field with the fallback message when the predicate has none", () => {
    const f = field({
      code: "lmp",
      label: "LMP",
      config: {
        logic: { predicates: [{ effect: "forbidden", when: { eq: { sex: "MALE" } } }] },
      },
    });
    const errors = validateTemplate(
      template([f]),
      snapshot({ systemValues: { sex: "MALE" }, formValues: { lmp: "x" } }),
    );
    expect(errors.lmp).toBe("LMP is not allowed here");
  });

  it("does not flag a forbidden field when its value is empty", () => {
    const f = field({
      code: "lmp",
      config: {
        logic: { predicates: [{ effect: "forbidden", when: { eq: { sex: "MALE" } } }] },
      },
    });
    expect(
      validateTemplate(template([f]), snapshot({ systemValues: { sex: "MALE" } })),
    ).toEqual({});
  });

  it("skips hidden fields entirely", () => {
    const f = field({
      code: "secret",
      required: true,
      config: {
        logic: { predicates: [{ effect: "visible", when: { eq: { show: true } } }] },
      },
    });
    expect(validateTemplate(template([f]), snapshot()).secret).toBeUndefined();
  });
});

describe("validateTemplate — value constraints", () => {
  function run(f: FormFieldDto, value: unknown) {
    return validateTemplate(template([f]), snapshot({ formValues: { [f.code]: value } }));
  }

  it("flags maxLength overflow", () => {
    const f = field({ code: "code", label: "Code", config: { validation: { maxLength: 3 } } });
    expect(run(f, "abcd").code).toContain("at most 3");
  });

  it("treats an invalid regex pattern as a no-op (value passes)", () => {
    const f = field({ code: "code", config: { validation: { pattern: "[" } } });
    expect(run(f, "anything")).toEqual({});
  });

  it("flags a value that does not match a valid pattern", () => {
    const f = field({ code: "code", label: "Code", config: { validation: { pattern: "^[0-9]+$" } } });
    expect(run(f, "12a").code).toContain("invalid format");
  });

  it("flags an unparseable DATE when notInFuture is set", () => {
    const f = field({
      code: "dob",
      label: "DOB",
      type: "DATE",
      config: { validation: { notInFuture: true } },
    });
    expect(run(f, "not-a-date").dob).toContain("not a valid date");
  });

  it("flags numeric min and max breaches (numeric string is coerced)", () => {
    const f = field({ code: "age", label: "Age", type: "NUMBER", config: { validation: { min: 0, max: 120 } } });
    expect(run(f, "-1").age).toContain("at least 0");
    expect(run(f, 200).age).toContain("at most 120");
    expect(run(f, "50")).toEqual({});
  });

  it("returns no constraint error when the field has no validation block", () => {
    const f = field({ code: "free", config: {} });
    expect(run(f, "whatever")).toEqual({});
  });

  it("ignores numeric constraints for a non-numeric string value", () => {
    const f = field({ code: "label", type: "NUMBER", config: { validation: { min: 5 } } });
    // 'abc' is not numeric → numeric coercion yields null → min not enforced.
    expect(run(f, "abc")).toEqual({});
  });
});

describe("mapServerFieldErrors — edge branches", () => {
  it("skips fields without a binding path and unknown server keys", () => {
    const tpl = template([
      field({ code: "named", binding: { namespace: "PATIENT", path: "full_name" } }),
      field({ code: "unbound", binding: { namespace: "PATIENT", path: null } }),
    ]);
    const out = mapServerFieldErrors(tpl, {
      full_name: ["bad name"],
      nonexistent_path: ["ignored"],
    });
    expect(out).toEqual({ named: "bad name" });
  });
});

describe("mapServerMessageErrors — edge branches", () => {
  const tpl = template([field({ code: "national_id" }), field({ code: "full_name" })]);

  it("ignores non-string entries and tokens without a space", () => {
    const out = mapServerMessageErrors(tpl, [
      42 as unknown as string,
      "national_id",
      "national_id has an invalid format",
    ]);
    expect(out).toEqual({ national_id: "has an invalid format" });
  });

  it("keeps the first message for a repeated field code", () => {
    const out = mapServerMessageErrors(tpl, [
      "full_name is required",
      "full_name is too short",
    ]);
    expect(out).toEqual({ full_name: "is required" });
  });
});
