import { describe, expect, it } from "vitest";
import type { ExecutionState } from "@/builder/runtime/TemplateExecutionContext";
import type {
  FormFieldDto,
  FormTemplateDto,
} from "@/builder/templates/template.types";
import { buildPatientHistorySubmission } from "./history-submission";

function field(
  code: string,
  type: "TEXT" | "NUMBER" | "DATE" | "SELECT",
  path: string,
): FormFieldDto {
  return {
    id: `f-${code}`,
    code,
    label: code,
    type,
    order: 0,
    required: false,
    binding: { namespace: "PATIENT_OBGYN_HISTORY", path },
    config: {},
  };
}

function emptyState(overrides: Partial<ExecutionState> = {}): ExecutionState {
  return {
    formValues: {},
    searchState: {},
    systemValues: {},
    repeatableRows: {},
    ...overrides,
  };
}

const template: FormTemplateDto = {
  id: "t1",
  code: "obgyn_patient_history",
  name: "OB/GYN Patient History",
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
      fields: [
        field("age_at_menarche", "NUMBER", "gynecological_baseline.age_at_menarche"),
        field("flow", "SELECT", "gynecological_baseline.flow"),
      ],
    },
    {
      id: "s2",
      code: "pregnancies",
      name: "Pregnancies",
      order: 1,
      is_repeatable: true,
      config: {},
      fields: [
        field("birth_date", "DATE", "pregnancies.birth_date"),
        field("outcome", "SELECT", "pregnancies.outcome"),
      ],
    },
  ],
};

describe("buildPatientHistorySubmission", () => {
  it("nests singleton fields under their dotted binding path", () => {
    const body = buildPatientHistorySubmission(
      template,
      emptyState({
        formValues: { age_at_menarche: 12, flow: "MODERATE" },
      }),
    );
    expect(body).toEqual({
      gynecological_baseline: { age_at_menarche: 12, flow: "MODERATE" },
    });
  });

  it("omits empty singleton fields", () => {
    const body = buildPatientHistorySubmission(
      template,
      emptyState({ formValues: { age_at_menarche: "" } }),
    );
    expect(body).toEqual({});
  });

  it("emits repeatable rows under section.code with the API leaf keys", () => {
    const body = buildPatientHistorySubmission(
      template,
      emptyState({
        repeatableRows: {
          pregnancies: [
            {
              rowKey: "k1",
              id: "row-id-1",
              values: { birth_date: "2024-01-01", outcome: "LIVE_BIRTH" },
            },
            {
              rowKey: "k2",
              values: { birth_date: "2025-02-02", outcome: "MISCARRIAGE" },
            },
          ],
        },
      }),
    );
    expect(body).toEqual({
      pregnancies: [
        {
          id: "row-id-1",
          birth_date: "2024-01-01",
          outcome: "LIVE_BIRTH",
        },
        { birth_date: "2025-02-02", outcome: "MISCARRIAGE" },
      ],
    });
  });

  it("drops a fresh blank row that the user added but never filled", () => {
    const body = buildPatientHistorySubmission(
      template,
      emptyState({
        repeatableRows: {
          pregnancies: [
            { rowKey: "k1", values: {} },
            { rowKey: "k2", values: { birth_date: "2024-01-01" } },
          ],
        },
      }),
    );
    expect(body).toEqual({
      pregnancies: [{ birth_date: "2024-01-01" }],
    });
  });

  it("omits a repeatable section the user did not touch", () => {
    const body = buildPatientHistorySubmission(template, emptyState());
    expect(body).not.toHaveProperty("pregnancies");
  });

  it("emits [] for sections in emitEmptySections (clear-all semantics)", () => {
    const body = buildPatientHistorySubmission(
      template,
      emptyState({
        repeatableRows: { pregnancies: [] },
      }),
      { emitEmptySections: new Set(["pregnancies"]) },
    );
    expect(body).toEqual({ pregnancies: [] });
  });

  it("works specialty-agnostically (template paths are opaque to the builder)", () => {
    const peds: FormTemplateDto = {
      ...template,
      code: "pediatrics_patient_history",
      sections: [
        {
          id: "g",
          code: "growth_history",
          name: "Growth",
          order: 0,
          config: {},
          fields: [
            {
              id: "h",
              code: "height",
              label: "Height",
              type: "NUMBER",
              order: 0,
              required: false,
              binding: { namespace: "PATIENT_OBGYN_HISTORY", path: "growth.height_cm" },
              config: {},
            } satisfies FormFieldDto,
          ],
        },
      ],
    };
    const body = buildPatientHistorySubmission(
      peds,
      emptyState({ formValues: { height: 110 } }),
    );
    expect(body).toEqual({ growth: { height_cm: 110 } });
  });
});