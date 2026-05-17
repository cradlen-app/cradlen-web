import { describe, expect, it } from "vitest";
import { resolveSpecialtyExamination } from "./specialty-resolver";

describe("resolveSpecialtyExamination", () => {
  it("returns null when specialty is missing", () => {
    expect(resolveSpecialtyExamination(null, "v1")).toBeNull();
    expect(resolveSpecialtyExamination(undefined, "v1")).toBeNull();
    expect(resolveSpecialtyExamination("   ", "v1")).toBeNull();
  });

  it("uses the GYN override for OB/GYN visits", () => {
    expect(resolveSpecialtyExamination("GYN", "visit-1")).toEqual({
      slug: "gyn",
      templateCode: "obgyn_examination",
      endpointPath: "/visits/visit-1/examination",
    });
  });

  it("override matching is case-insensitive on specialty code", () => {
    const upper = resolveSpecialtyExamination("gyn", "visit-2");
    expect(upper?.templateCode).toBe("obgyn_examination");
    expect(upper?.endpointPath).toBe("/visits/visit-2/examination");
  });

  it("falls back to the convention for unknown specialties", () => {
    expect(resolveSpecialtyExamination("PEDS", "visit-3")).toEqual({
      slug: "peds",
      templateCode: "peds_examination",
      endpointPath: "/visits/visit-3/peds-examination",
    });
  });
});
