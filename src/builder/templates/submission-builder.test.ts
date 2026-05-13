import { describe, expect, it } from "vitest";
import {
  buildSubmission,
  pickSubmissionEndpoint,
  type ExecutionSnapshot,
} from "./submission-builder";
import type { FormTemplateDto } from "./template.types";

function makeTemplate(): FormTemplateDto {
  return {
    id: "tpl",
    code: "book_visit",
    name: "OB book visit",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [
      {
        id: "s1",
        code: "search",
        name: "Search",
        order: 0,
        config: {},
        fields: [
          {
            id: "f-patient-search",
            code: "patient_search",
            label: "Find patient",
            type: "ENTITY_SEARCH",
            order: 0,
            required: false,
            binding: { namespace: "LOOKUP", path: "patient_id" },
            config: { logic: { entity: "patient" } },
          },
        ],
      },
      {
        id: "s2",
        code: "patient_info",
        name: "Patient info",
        order: 1,
        config: {
          logic: {
            predicates: [
              { effect: "visible", when: { eq: { visitor_type: "PATIENT" } } },
            ],
          },
        },
        fields: [
          {
            id: "f-full-name",
            code: "full_name",
            label: "Full name",
            type: "TEXT",
            order: 0,
            required: false,
            binding: { namespace: "PATIENT", path: "full_name" },
            config: {},
          },
          {
            id: "f-spouse-full-name",
            code: "spouse_full_name",
            label: "Spouse full name",
            type: "TEXT",
            order: 1,
            required: false,
            binding: { namespace: "GUARDIAN", path: "full_name" },
            config: {},
          },
        ],
      },
      {
        id: "s3",
        code: "vitals",
        name: "Vitals",
        order: 2,
        config: {
          logic: {
            predicates: [
              { effect: "visible", when: { eq: { visitor_type: "PATIENT" } } },
            ],
          },
        },
        fields: [
          {
            id: "f-systolic",
            code: "systolic_bp",
            label: "Systolic BP",
            type: "NUMBER",
            order: 0,
            required: false,
            binding: { namespace: "INTAKE", path: "vitals.systolic_bp" },
            config: {},
          },
          {
            id: "f-bmi",
            code: "bmi",
            label: "BMI",
            type: "COMPUTED",
            order: 1,
            required: false,
            binding: { namespace: "COMPUTED", path: "vitals.bmi" },
            config: {},
          },
        ],
      },
      {
        id: "s4",
        code: "visit_metadata",
        name: "Visit metadata",
        order: 3,
        config: {},
        fields: [
          {
            id: "f-visitor-type",
            code: "visitor_type",
            label: "Visitor type",
            type: "SELECT",
            order: 0,
            required: true,
            binding: { namespace: "SYSTEM", path: "visitor_type" },
            config: { logic: { is_discriminator: true } },
          },
        ],
      },
    ],
  };
}

describe("buildSubmission", () => {
  it("places PATIENT, INTAKE (nested), and GUARDIAN bindings; skips SYSTEM + COMPUTED", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "PATIENT" },
      formValues: {
        full_name: "Aisha",
        spouse_full_name: "Omar",
        systolic_bp: 120,
        bmi: 22.5,
      },
      searchState: {},
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body).toEqual({
      full_name: "Aisha",
      spouse_full_name: "Omar",
      vitals: { systolic_bp: 120 },
    });
    expect(body).not.toHaveProperty("visitor_type");
    expect(body.vitals as Record<string, unknown>).not.toHaveProperty("bmi");
  });

  it("submits resolved LOOKUP id", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "PATIENT" },
      formValues: {},
      searchState: {
        patient_search: { resolvedEntityId: { id: "p-1", label: "Aisha" } },
      },
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body.patient_id).toBe("p-1");
  });

  it("skips fields inside a hidden section", () => {
    const snapshot: ExecutionSnapshot = {
      systemValues: { visitor_type: "MEDICAL_REP" },
      formValues: { full_name: "Aisha", systolic_bp: 120 },
      searchState: {},
    };
    const body = buildSubmission(makeTemplate(), snapshot);
    expect(body).not.toHaveProperty("full_name");
    expect(body).not.toHaveProperty("vitals");
  });
});

describe("pickSubmissionEndpoint", () => {
  it("routes by visitor_type", () => {
    expect(pickSubmissionEndpoint({ visitor_type: "PATIENT" })).toBe("/visits/book");
    expect(pickSubmissionEndpoint({ visitor_type: "MEDICAL_REP" })).toBe(
      "/medical-rep-visits/book",
    );
    expect(pickSubmissionEndpoint({})).toBe("/visits/book");
  });
});
