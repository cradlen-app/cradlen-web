import { medicalRepQueryKeys } from "./medical-rep.queryKeys";

describe("medicalRepQueryKeys", () => {
  it("all() returns stable root key", () => {
    expect(medicalRepQueryKeys.all()).toEqual(["medical-reps"]);
  });

  it("list() includes all params in key", () => {
    const key = medicalRepQueryKeys.list({ page: 2, limit: 10, search: "fatma", status: "active" });
    expect(key).toContain("medical-reps");
    expect(key).toContain("list");
    expect(key).toContain(2);
    expect(key).toContain(10);
    expect(key).toContain("fatma");
    expect(key).toContain("active");
  });

  it("list() with different params produces different keys", () => {
    const a = medicalRepQueryKeys.list({ page: 1, limit: 10, search: "", status: "" });
    const b = medicalRepQueryKeys.list({ page: 2, limit: 10, search: "", status: "" });
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it("list() key starts with all() root", () => {
    const root = medicalRepQueryKeys.all();
    const list = medicalRepQueryKeys.list({ page: 1, limit: 10, search: "", status: "" });
    expect(list[0]).toBe(root[0]);
  });
});
