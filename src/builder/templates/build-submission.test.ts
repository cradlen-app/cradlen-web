import { describe, expect, it } from "vitest";
import { buildTemplateSubmission } from "./build-submission";
import type { ExecutionState } from "../runtime/TemplateExecutionContext";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "./template.types";

function field(partial: Partial<FormFieldDto> & Pick<FormFieldDto, "code">): FormFieldDto {
  return {
    id: partial.code,
    label: partial.code,
    type: "TEXT",
    order: 0,
    required: false,
    binding: { namespace: null, path: null },
    config: {},
    ...partial,
  };
}

function section(
  code: string,
  fields: FormFieldDto[],
  partial: Partial<FormSectionDto> = {},
): FormSectionDto {
  return {
    id: code,
    code,
    name: code,
    order: 0,
    config: {},
    fields,
    ...partial,
  };
}

function template(sections: FormSectionDto[]): FormTemplateDto {
  return {
    id: "t",
    code: "history",
    name: "History",
    description: null,
    scope: "PATIENT_HISTORY",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections,
  };
}

function state(partial: Partial<ExecutionState> = {}): ExecutionState {
  return {
    formValues: {},
    searchState: {},
    systemValues: {},
    repeatableRows: {},
    ...partial,
  };
}

describe("buildTemplateSubmission — singleton sections", () => {
  it("writes each field value into a nested object resolved from its binding path", () => {
    const tpl = template([
      section("baseline", [
        field({ code: "flow", binding: { namespace: "PATIENT", path: "gyn_baseline.flow" } }),
        field({ code: "cycle", binding: { namespace: "PATIENT", path: "gyn_baseline.cycle" } }),
      ]),
    ]);
    const body = buildTemplateSubmission(
      tpl,
      state({ formValues: { flow: "HEAVY", cycle: 28 } }),
    );
    expect(body).toEqual({ gyn_baseline: { flow: "HEAVY", cycle: 28 } });
  });

  it("skips empty values, SYSTEM and COMPUTED bindings, and unbound fields", () => {
    const tpl = template([
      section("mix", [
        field({ code: "blank", binding: { namespace: "PATIENT", path: "obj.blank" } }),
        field({ code: "sys", binding: { namespace: "SYSTEM", path: "obj.sys" } }),
        field({ code: "calc", binding: { namespace: "COMPUTED", path: "obj.calc" } }),
        field({ code: "unbound", binding: { namespace: null, path: null } }),
        field({ code: "kept", binding: { namespace: "PATIENT", path: "obj.kept" } }),
      ]),
    ]);
    const body = buildTemplateSubmission(
      tpl,
      state({
        formValues: {
          blank: "   ",
          sys: "x",
          calc: 9,
          unbound: "y",
          kept: "value",
        },
      }),
    );
    expect(body).toEqual({ obj: { kept: "value" } });
  });

  it("nests namespaced fields under a configured container key", () => {
    const tpl = template([
      section("hist", [
        field({
          code: "g",
          binding: { namespace: "PATIENT_OBGYN_HISTORY", path: "gravida" },
        }),
      ]),
    ]);
    const body = buildTemplateSubmission(
      tpl,
      state({ formValues: { g: 3 } }),
      { namespaceContainers: { PATIENT_OBGYN_HISTORY: "obgyn_history" } },
    );
    expect(body).toEqual({ obgyn_history: { gravida: 3 } });
  });

  it("skips a field hidden by its visibility predicate", () => {
    const tpl = template([
      section("cond", [
        field({
          code: "secret",
          binding: { namespace: "PATIENT", path: "obj.secret" },
          config: {
            logic: {
              predicates: [{ effect: "visible", when: { eq: { mode: "ON" } } }],
            },
          },
        }),
      ]),
    ]);
    const hidden = buildTemplateSubmission(
      tpl,
      state({ systemValues: { mode: "OFF" }, formValues: { secret: "v" } }),
    );
    expect(hidden).toEqual({});
    const shown = buildTemplateSubmission(
      tpl,
      state({ systemValues: { mode: "ON" }, formValues: { secret: "v" } }),
    );
    expect(shown).toEqual({ obj: { secret: "v" } });
  });

  it("skips a whole section hidden by a section-level predicate", () => {
    const tpl = template([
      section(
        "s",
        [field({ code: "a", binding: { namespace: "PATIENT", path: "o.a" } })],
        {
          config: {
            logic: {
              predicates: [{ effect: "visible", when: { eq: { mode: "ON" } } }],
            },
          },
        },
      ),
    ]);
    const body = buildTemplateSubmission(
      tpl,
      state({ systemValues: { mode: "OFF" }, formValues: { a: "x" } }),
    );
    expect(body).toEqual({});
  });

  it("skips sections listed in excludeSectionCodes", () => {
    const tpl = template([
      section("keep", [field({ code: "k", binding: { namespace: "PATIENT", path: "o.k" } })]),
      section("drop", [field({ code: "d", binding: { namespace: "PATIENT", path: "o.d" } })]),
    ]);
    const body = buildTemplateSubmission(
      tpl,
      state({ formValues: { k: "1", d: "2" } }),
      { excludeSectionCodes: new Set(["drop"]) },
    );
    expect(body).toEqual({ o: { k: "1" } });
  });
});

describe("buildTemplateSubmission — repeatable sections", () => {
  const tpl = template([
    section(
      "allergies",
      [
        field({ code: "allergy_to", binding: { namespace: "PATIENT", path: "allergies.allergy_to" } }),
        field({ code: "reaction", binding: { namespace: "PATIENT", path: "allergies.reaction" } }),
      ],
      { is_repeatable: true },
    ),
  ]);

  it("maps rows to {tail: value} under the binding-path head key, dropping empty rows", () => {
    const body = buildTemplateSubmission(
      tpl,
      state({
        repeatableRows: {
          allergies: [
            { rowKey: "r1", values: { allergy_to: "Penicillin", reaction: "Rash" } },
            { rowKey: "r2", values: {} }, // empty + no id → dropped
            { rowKey: "r3", values: { allergy_to: "  " } }, // empty value → dropped
          ],
        },
      }),
    );
    expect(body).toEqual({
      allergies: [{ allergy_to: "Penicillin", reaction: "Rash" }],
    });
  });

  it("keeps an existing (id-bearing) row even when it has no content", () => {
    const body = buildTemplateSubmission(
      tpl,
      state({
        repeatableRows: {
          allergies: [{ rowKey: "r1", id: "srv-1", values: {} }],
        },
      }),
    );
    expect(body).toEqual({ allergies: [{ id: "srv-1" }] });
  });

  it("includes the server id alongside content for edited rows", () => {
    const body = buildTemplateSubmission(
      tpl,
      state({
        repeatableRows: {
          allergies: [{ rowKey: "r1", id: "srv-1", values: { allergy_to: "Latex" } }],
        },
      }),
    );
    expect(body).toEqual({ allergies: [{ id: "srv-1", allergy_to: "Latex" }] });
  });

  it("omits the array entirely when no content and not in emitEmptySections", () => {
    const body = buildTemplateSubmission(
      tpl,
      state({ repeatableRows: { allergies: [{ rowKey: "r1", values: {} }] } }),
    );
    expect(body).toEqual({});
  });

  it("emits an explicit empty array to clear the collection when requested", () => {
    const body = buildTemplateSubmission(
      tpl,
      state({ repeatableRows: { allergies: [] } }),
      { emitEmptySections: new Set(["allergies"]) },
    );
    expect(body).toEqual({ allergies: [] });
  });

  it("drops a row field hidden by its per-row visibility predicate", () => {
    const condTpl = template([
      section(
        "rows",
        [
          field({ code: "kind", binding: { namespace: "PATIENT", path: "rows.kind" } }),
          field({
            code: "detail",
            binding: { namespace: "PATIENT", path: "rows.detail" },
            config: {
              logic: {
                predicates: [{ effect: "visible", when: { eq: { kind: "OTHER" } } }],
              },
            },
          }),
        ],
        { is_repeatable: true },
      ),
    ]);
    const body = buildTemplateSubmission(
      condTpl,
      state({
        repeatableRows: {
          rows: [{ rowKey: "r1", values: { kind: "STD", detail: "hidden" } }],
        },
      }),
    );
    expect(body).toEqual({ rows: [{ kind: "STD" }] });
  });

  it("falls back to the section code as the array key when no field has a dotted path", () => {
    const tpl2 = template([
      section(
        "notes",
        [field({ code: "note", binding: { namespace: "PATIENT", path: "note" } })],
        { is_repeatable: true },
      ),
    ]);
    const body = buildTemplateSubmission(
      tpl2,
      state({ repeatableRows: { notes: [{ rowKey: "r", values: { note: "hi" } }] } }),
    );
    expect(body).toEqual({ notes: [{ note: "hi" }] });
  });

  it("nests a repeatable array under a configured namespace container", () => {
    const body = buildTemplateSubmission(
      tpl,
      state({
        repeatableRows: {
          allergies: [{ rowKey: "r1", values: { allergy_to: "Dust" } }],
        },
      }),
      { namespaceContainers: { PATIENT: "obgyn_history" } },
    );
    expect(body).toEqual({
      obgyn_history: { allergies: [{ allergy_to: "Dust" }] },
    });
  });
});
