import { describe, expect, it } from "vitest";
import type {
  FormFieldDto,
  FormTemplateDto,
} from "@/builder/templates/template.types";
import { toInitialHistoryState } from "./history-initial-values";

function field(
  code: string,
  type: "TEXT" | "NUMBER" | "DATE" | "ENTITY_SEARCH" | "SELECT",
  path: string,
  extra: Record<string, unknown> = {},
): FormFieldDto {
  return {
    id: `f-${code}`,
    code,
    label: code,
    type,
    order: 0,
    required: false,
    binding: { namespace: "PATIENT_OBGYN_HISTORY", path },
    config: extra,
  };
}

const template: FormTemplateDto = {
  id: "t1",
  code: "obgyn_patient_history",
  name: "x",
  description: null,
  scope: "PATIENT_HISTORY",
  version: 1,
  activated_at: null,
  specialty_id: null,
  sections: [
    {
      id: "s1",
      code: "menstrual_history",
      name: "Menstrual",
      order: 0,
      config: {},
      fields: [field("age_at_menarche", "NUMBER", "gynecological_baseline.age_at_menarche")],
    },
    {
      id: "s2",
      code: "medications",
      name: "Medications",
      order: 1,
      is_repeatable: true,
      config: {},
      fields: [
        field("drug_name", "ENTITY_SEARCH", "medications.drug_name", {
          ui: { searchEntity: { kind: "medication", idTarget: "medication_id" } },
          logic: { entity: "medication" },
        }),
        field("medication_id", "TEXT", "medications.medication_id"),
        field("indication", "TEXT", "medications.indication"),
      ],
    },
  ],
};

describe("toInitialHistoryState", () => {
  it("loads singleton JSON columns by binding path", () => {
    const env = {
      patient_id: "p1",
      version: 3,
      updated_at: "2026-05-17",
      gynecological_baseline: { age_at_menarche: 13 },
    };
    const init = toInitialHistoryState(env, template);
    expect(init.formValues).toEqual({ age_at_menarche: 13 });
  });

  it("loads repeatable rows under section.code and preserves server ids", () => {
    const env = {
      patient_id: "p1",
      version: 1,
      updated_at: "x",
      medications: [
        { id: "m1", drug_name: "Aspirin", medication_id: "cat-1", indication: "Pain" },
        { id: "m2", drug_name: "Folate", medication_id: null },
      ],
    };
    const init = toInitialHistoryState(env, template);
    expect(init.repeatableRows.medications).toHaveLength(2);
    expect(init.repeatableRows.medications[0]).toMatchObject({
      id: "m1",
      values: { drug_name: "Aspirin", medication_id: "cat-1", indication: "Pain" },
      searchState: {
        drug_name: {
          resolvedEntityId: { id: "cat-1", label: "Aspirin" },
          transientValue: "Aspirin",
        },
      },
    });
    expect(init.repeatableRows.medications[1]).toMatchObject({
      id: "m2",
      values: { drug_name: "Folate" },
    });
    // No resolved id on row 2 → no search state for drug_name.
    expect(init.repeatableRows.medications[1].searchState).toBeUndefined();
  });
});