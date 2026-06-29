import { describe, expect, it } from "vitest";
import { toInitialFormState, type TemplateEnvelope } from "./initial-values";
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
  return { id: code, code, name: code, order: 0, config: {}, fields, ...partial };
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

describe("toInitialFormState — singleton sections", () => {
  it("pulls each field value by its binding path", () => {
    const tpl = template([
      section("baseline", [
        field({ code: "flow", binding: { namespace: "PATIENT", path: "gyn.flow" } }),
        field({ code: "cycle", binding: { namespace: "PATIENT", path: "gyn.cycle" } }),
      ]),
    ]);
    const envelope: TemplateEnvelope = { gyn: { flow: "HEAVY", cycle: 28 } };
    const result = toInitialFormState(envelope, tpl);
    expect(result.formValues).toEqual({ flow: "HEAVY", cycle: 28 });
    expect(result.repeatableRows).toEqual({});
  });

  it("ignores missing / null values and unbound fields", () => {
    const tpl = template([
      section("s", [
        field({ code: "absent", binding: { namespace: "PATIENT", path: "gyn.absent" } }),
        field({ code: "nul", binding: { namespace: "PATIENT", path: "gyn.nul" } }),
        field({ code: "unbound", binding: { namespace: null, path: null } }),
      ]),
    ]);
    const result = toInitialFormState({ gyn: { nul: null } }, tpl);
    expect(result.formValues).toEqual({});
  });

  it("reads namespaced values from their configured envelope container", () => {
    const tpl = template([
      section("hist", [
        field({
          code: "g",
          binding: { namespace: "PATIENT_OBGYN_HISTORY", path: "gravida" },
        }),
      ]),
    ]);
    const result = toInitialFormState(
      { obgyn_history: { gravida: 4 } },
      tpl,
      { namespaceContainers: { PATIENT_OBGYN_HISTORY: "obgyn_history" } },
    );
    expect(result.formValues).toEqual({ g: 4 });
  });

  it("seeds searchState for a populated ENTITY_SEARCH string value", () => {
    const tpl = template([
      section("s", [
        field({
          code: "rep",
          type: "ENTITY_SEARCH",
          binding: { namespace: "MEDICAL_REP", path: "rep_name" },
        }),
      ]),
    ]);
    const result = toInitialFormState({ rep_name: "Rep One" }, tpl);
    expect(result.formValues.rep).toBe("Rep One");
    expect(result.searchState.rep).toEqual({
      transientValue: "Rep One",
      suggestions: [],
      resolvedEntityId: null,
    });
  });
});

describe("toInitialFormState — repeatable sections", () => {
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

  it("hydrates rows from the array and appends one trailing empty row", () => {
    const result = toInitialFormState(
      {
        allergies: [
          { id: "srv-1", allergy_to: "Penicillin", reaction: "Rash" },
          { id: "srv-2", allergy_to: "Latex", reaction: null },
        ],
      },
      tpl,
    );
    const rows = result.repeatableRows.allergies;
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      id: "srv-1",
      values: { allergy_to: "Penicillin", reaction: "Rash" },
    });
    // null leaf is skipped during hydration.
    expect(rows[1].values).toEqual({ allergy_to: "Latex" });
    // trailing empty row.
    expect(rows[2].values).toEqual({});
    expect(rows[2].id).toBeUndefined();
    // unique row keys.
    expect(new Set(rows.map((r) => r.rowKey)).size).toBe(3);
  });

  it("produces just a single trailing empty row when the array is absent", () => {
    const result = toInitialFormState({}, tpl);
    expect(result.repeatableRows.allergies).toHaveLength(1);
    expect(result.repeatableRows.allergies[0].values).toEqual({});
  });

  it("drops a non-string row id", () => {
    const result = toInitialFormState(
      { allergies: [{ id: 99, allergy_to: "Dust" }] },
      tpl,
    );
    expect(result.repeatableRows.allergies[0].id).toBeUndefined();
  });

  it("resolves an ENTITY_SEARCH row to its picked entity via the idTarget sibling", () => {
    const repTpl = template([
      section(
        "meds",
        [
          field({
            code: "drug_search",
            type: "ENTITY_SEARCH",
            binding: { namespace: "PRESCRIPTION_ITEM", path: "meds.name" },
            config: {
              ui: { searchEntity: { kind: "medication", idTarget: "med_id" } },
            },
          }),
          field({
            code: "med_id",
            binding: { namespace: "PRESCRIPTION_ITEM", path: "meds.medication_id" },
          }),
        ],
        { is_repeatable: true },
      ),
    ]);
    const result = toInitialFormState(
      { meds: [{ name: "Paracetamol", medication_id: "m-1" }] },
      repTpl,
    );
    const row = result.repeatableRows.meds[0];
    expect(row.values).toEqual({ drug_search: "Paracetamol", med_id: "m-1" });
    expect(row.searchState?.drug_search).toEqual({
      transientValue: "Paracetamol",
      suggestions: [],
      resolvedEntityId: { id: "m-1", label: "Paracetamol" },
    });
  });

  it("leaves searchState undefined on a row with no resolvable entity", () => {
    const result = toInitialFormState(
      { allergies: [{ allergy_to: "Dust" }] },
      tpl,
    );
    expect(result.repeatableRows.allergies[0].searchState).toBeUndefined();
  });
});
