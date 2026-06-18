import { describe, expect, it } from "vitest";
import { resolveSpecialtyExamination } from "./specialty-resolver";

describe("resolveSpecialtyExamination", () => {
  it("returns null when specialty is missing", () => {
    expect(resolveSpecialtyExamination(null, null, "v1")).toBeNull();
    expect(resolveSpecialtyExamination(null, undefined, "v1")).toBeNull();
    expect(resolveSpecialtyExamination("OBSTETRICS", "   ", "v1")).toBeNull();
  });

  it("uses the OBGYN override — endpoint is /examination, not /obgyn-examination", () => {
    expect(resolveSpecialtyExamination(null, "OBGYN", "visit-1")).toEqual({
      slug: "obgyn",
      templateCode: "obgyn_examination",
      fallbackTemplateCode: null,
      endpointPath: "/visits/visit-1/examination",
    });
  });

  it("override matching is case-insensitive on specialty code", () => {
    const result = resolveSpecialtyExamination(null, "obgyn", "visit-2");
    expect(result?.templateCode).toBe("obgyn_examination");
    expect(result?.endpointPath).toBe("/visits/visit-2/examination");
  });

  it("falls back to the convention for unknown specialties", () => {
    expect(resolveSpecialtyExamination(null, "PEDS", "visit-3")).toEqual({
      slug: "peds",
      templateCode: "peds_examination",
      fallbackTemplateCode: null,
      endpointPath: "/visits/visit-3/peds-examination",
    });
  });

  it("prefers the subspecialty template, keeping the specialty data endpoint + fallback", () => {
    // Subspecialty drives the template code; the endpoint and fallback stay
    // specialty-driven (OBGYN override → /examination + obgyn_examination).
    expect(resolveSpecialtyExamination("OBSTETRICS", "OBGYN", "visit-4")).toEqual({
      slug: "obgyn",
      templateCode: "obstetrics_examination",
      fallbackTemplateCode: "obgyn_examination",
      endpointPath: "/visits/visit-4/examination",
    });
  });

  it("subspecialty template code follows the convention case-insensitively", () => {
    const result = resolveSpecialtyExamination("Maternal_Fetal", "OBGYN", "v5");
    expect(result?.templateCode).toBe("maternal_fetal_examination");
    expect(result?.fallbackTemplateCode).toBe("obgyn_examination");
  });

  it("ignores a blank subspecialty and resolves by specialty", () => {
    const result = resolveSpecialtyExamination("  ", "PEDS", "v6");
    expect(result?.templateCode).toBe("peds_examination");
    expect(result?.fallbackTemplateCode).toBeNull();
  });
});
