import { describe, expect, it } from "vitest";
import { resolveSpecialtyHistory } from "./specialty-resolver";

describe("resolveSpecialtyHistory", () => {
  it("resolves OBGYN to obgyn_patient_history + obgyn-history endpoint by convention", () => {
    expect(resolveSpecialtyHistory("OBGYN", "patient-1")).toEqual({
      slug: "obgyn",
      templateCode: "obgyn_patient_history",
      endpointPath: "/patients/patient-1/obgyn-history",
    });
  });

  it("is case-insensitive on the specialty code", () => {
    const upper = resolveSpecialtyHistory("OBGYN", "p1");
    const lower = resolveSpecialtyHistory("obgyn", "p1");
    const mixed = resolveSpecialtyHistory("Obgyn", "p1");
    expect(lower).toEqual(upper);
    expect(mixed).toEqual(upper);
  });

  it("falls back to bare convention for specialties without an override", () => {
    expect(resolveSpecialtyHistory("PEDIATRICS", "p9")).toEqual({
      slug: "pediatrics",
      templateCode: "pediatrics_patient_history",
      endpointPath: "/patients/p9/pediatrics-history",
    });
  });

  it("returns null when specialty is null / undefined / blank", () => {
    expect(resolveSpecialtyHistory(null, "p1")).toBeNull();
    expect(resolveSpecialtyHistory(undefined, "p1")).toBeNull();
    expect(resolveSpecialtyHistory("   ", "p1")).toBeNull();
  });
});
