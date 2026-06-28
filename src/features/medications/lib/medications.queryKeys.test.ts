import { describe, expect, it } from "vitest";
import { medicationQueryKeys } from "./medications.queryKeys";
import type { MedicationListParams } from "./medications.queryKeys";

const base: MedicationListParams = {
  page: 1,
  limit: 20,
  search: "",
};

describe("medicationQueryKeys", () => {
  it("all() returns the stable root key", () => {
    expect(medicationQueryKeys.all()).toEqual(["medications"]);
  });

  it("facets() returns a stable facets key under the root", () => {
    expect(medicationQueryKeys.facets()).toEqual(["medications", "facets"]);
  });

  it("list() encodes every param positionally with defaults applied", () => {
    expect(medicationQueryKeys.list(base)).toEqual([
      "medications",
      "list",
      1,
      20,
      "",
      null,
      null,
      "name_asc",
    ]);
  });

  it("list() reflects provided category, form and sort", () => {
    expect(
      medicationQueryKeys.list({
        ...base,
        page: 3,
        search: "amox",
        category: "Antibiotic",
        form: "Tablet",
        sort: "usage",
      }),
    ).toEqual([
      "medications",
      "list",
      3,
      20,
      "amox",
      "Antibiotic",
      "Tablet",
      "usage",
    ]);
  });

  it("list() defaults missing category/form to null and sort to name_asc", () => {
    const key = medicationQueryKeys.list(base);
    expect(key[5]).toBeNull();
    expect(key[6]).toBeNull();
    expect(key[7]).toBe("name_asc");
  });

  it("list() starts with the all() root segment", () => {
    expect(medicationQueryKeys.list(base)[0]).toBe(medicationQueryKeys.all()[0]);
  });

  it("different params yield different keys", () => {
    const a = medicationQueryKeys.list(base);
    const b = medicationQueryKeys.list({ ...base, page: 2 });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });
});
