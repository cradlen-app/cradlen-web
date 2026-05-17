import { describe, expect, it } from "vitest";
import { resolveSpecialtyHistory } from "./specialty-resolver";

describe("resolveSpecialtyHistory", () => {
  it("maps OBGYN → obgyn_patient_history + obgyn-history endpoint", () => {
    expect(resolveSpecialtyHistory("OBGYN", "patient-1")).toEqual({
      slug: "obgyn",
      templateCode: "obgyn_patient_history",
      endpointPath: "/patients/patient-1/obgyn-history",
    });
  });

  it("is case-insensitive on the specialty code", () => {
    const a = resolveSpecialtyHistory("OBGYN", "p1");
    const b = resolveSpecialtyHistory("obgyn", "p1");
    expect(a).toEqual(b);
  });

  it("returns null when specialty is null / undefined / blank", () => {
    expect(resolveSpecialtyHistory(null, "p1")).toBeNull();
    expect(resolveSpecialtyHistory(undefined, "p1")).toBeNull();
    expect(resolveSpecialtyHistory("   ", "p1")).toBeNull();
  });

  it("supports future specialties without code changes", () => {
    expect(resolveSpecialtyHistory("PEDIATRICS", "p9")).toEqual({
      slug: "pediatrics",
      templateCode: "pediatrics_patient_history",
      endpointPath: "/patients/p9/pediatrics-history",
    });
  });
});