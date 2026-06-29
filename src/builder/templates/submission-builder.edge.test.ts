import { describe, expect, it } from "vitest";
import {
  buildSubmission,
  type ExecutionSnapshot,
} from "./submission-builder";
import type {
  FormFieldDto,
  FormSectionDto,
  FormTemplateDto,
} from "./template.types";

let seq = 0;
function field(partial: Partial<FormFieldDto> & { code: string }): FormFieldDto {
  seq += 1;
  return {
    id: `f-${seq}`,
    label: partial.code,
    type: "TEXT",
    order: seq,
    required: false,
    binding: { namespace: "PATIENT", path: partial.code },
    config: {},
    ...partial,
  } as FormFieldDto;
}

function template(fields: FormFieldDto[]): FormTemplateDto {
  const section: FormSectionDto = {
    id: "s",
    code: "sec",
    name: "Sec",
    order: 0,
    config: {},
    fields,
  };
  return {
    id: "tpl",
    code: "tpl",
    name: "T",
    description: null,
    scope: "BOOK_VISIT",
    version: 1,
    activated_at: null,
    specialty_id: null,
    sections: [section],
  };
}

function snapshot(partial: Partial<ExecutionSnapshot> = {}): ExecutionSnapshot {
  return { formValues: {}, systemValues: {}, searchState: {}, ...partial };
}

describe("buildSubmission — LOOKUP id sources", () => {
  it("uses the LOOKUP id from formValues when searchState has none", () => {
    const tpl = template([
      field({ code: "patient_id", type: "ENTITY_SEARCH", binding: { namespace: "LOOKUP", path: "patient_id" } }),
    ]);
    const body = buildSubmission(tpl, snapshot({ formValues: { patient_id: "pat-7" } }));
    expect(body.patient_id).toBe("pat-7");
  });

  it("omits the LOOKUP binding when neither search nor form carries an id", () => {
    const tpl = template([
      field({ code: "patient_id", type: "ENTITY_SEARCH", binding: { namespace: "LOOKUP", path: "patient_id" } }),
    ]);
    // Empty string in formValues must not count as a resolved id.
    const body = buildSubmission(tpl, snapshot({ formValues: { patient_id: "" } }));
    expect(body).not.toHaveProperty("patient_id");
  });

  it("prefers the resolved searchState id over the form value", () => {
    const tpl = template([
      field({ code: "patient_id", type: "ENTITY_SEARCH", binding: { namespace: "LOOKUP", path: "patient_id" } }),
    ]);
    const body = buildSubmission(
      tpl,
      snapshot({
        formValues: { patient_id: "from-form" },
        searchState: { patient_id: { transientValue: "", suggestions: [], resolvedEntityId: { id: "from-search", label: "x" } } },
      }),
    );
    expect(body.patient_id).toBe("from-search");
  });
});

describe("buildSubmission — nested path assembly", () => {
  it("merges two INTAKE fields under the same nested container", () => {
    const tpl = template([
      field({ code: "sys", type: "NUMBER", binding: { namespace: "INTAKE", path: "vitals.systolic_bp" } }),
      field({ code: "dia", type: "NUMBER", binding: { namespace: "INTAKE", path: "vitals.diastolic_bp" } }),
    ]);
    const body = buildSubmission(tpl, snapshot({ formValues: { sys: 120, dia: 80 } }));
    expect(body.vitals).toEqual({ systolic_bp: 120, diastolic_bp: 80 });
  });

  it("places a VISIT-namespaced value at its binding path", () => {
    const tpl = template([
      field({ code: "priority", type: "SELECT", binding: { namespace: "VISIT", path: "priority" } }),
    ]);
    const body = buildSubmission(tpl, snapshot({ formValues: { priority: "HIGH" } }));
    expect(body.priority).toBe("HIGH");
  });
});

describe("buildSubmission — suppression keyed by idTarget", () => {
  it("suppresses the host + fillFields when the resolved entity lives under the idTarget code", () => {
    const tpl = template([
      field({ code: "rep_id", type: "ENTITY_SEARCH", binding: { namespace: "LOOKUP", path: "medical_rep_id" } }),
      field({
        code: "rep_name",
        binding: { namespace: "MEDICAL_REP", path: "full_name" },
        config: {
          ui: {
            searchEntity: {
              kind: "medical_rep",
              idTarget: "rep_id",
              fillFields: { rep_natid: "national_id" },
            },
          },
        },
      }),
      field({ code: "rep_natid", binding: { namespace: "MEDICAL_REP", path: "national_id" } }),
    ]);
    const body = buildSubmission(
      tpl,
      snapshot({
        systemValues: { visitor_type: "MEDICAL_REP" },
        formValues: { rep_name: "Rep One", rep_natid: "123" },
        // Resolved entity is keyed by the idTarget field code, not the host.
        searchState: { rep_id: { transientValue: "", suggestions: [], resolvedEntityId: { id: "rep-9", label: "Rep One" } } },
      }),
    );
    expect(body.medical_rep_id).toBe("rep-9");
    expect(body).not.toHaveProperty("full_name");
    expect(body).not.toHaveProperty("national_id");
  });

  it("submits the host field normally when its idTarget has no resolved entity", () => {
    const tpl = template([
      field({ code: "rep_id", type: "ENTITY_SEARCH", binding: { namespace: "LOOKUP", path: "medical_rep_id" } }),
      field({
        code: "rep_name",
        binding: { namespace: "MEDICAL_REP", path: "full_name" },
        config: {
          ui: { searchEntity: { kind: "medical_rep", idTarget: "rep_id" } },
        },
      }),
    ]);
    const body = buildSubmission(
      tpl,
      snapshot({
        systemValues: { visitor_type: "MEDICAL_REP" },
        formValues: { rep_name: "New Rep" },
      }),
    );
    // No resolved id → not suppressed → the typed name ships for the create path.
    expect(body.full_name).toBe("New Rep");
    expect(body).not.toHaveProperty("medical_rep_id");
  });
});

describe("buildSubmission — unbound fields", () => {
  it("skips a field that has no namespace or no path", () => {
    const tpl = template([
      field({ code: "noNs", binding: { namespace: null, path: "x" } }),
      field({ code: "noPath", binding: { namespace: "PATIENT", path: null } }),
    ]);
    const body = buildSubmission(tpl, snapshot({ formValues: { noNs: "a", noPath: "b" } }));
    expect(body).toEqual({});
  });
});
