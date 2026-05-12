import { describe, expect, it } from "vitest";

import {
  DuplicateI18nNamespaceError,
  I18nRegistry,
} from "./I18nRegistry";

describe("I18nRegistry", () => {
  it("loads each namespace's slice and wraps it under the namespace", async () => {
    const reg = new I18nRegistry();
    reg.register("staff", async (locale) => ({ title: locale === "ar" ? "الطاقم" : "Staff" }));
    reg.register("patients", async () => ({ list: "Patients" }));

    const merged = await reg.loadAll("en");
    expect(merged).toEqual({
      staff: { title: "Staff" },
      patients: { list: "Patients" },
    });

    const ar = await reg.loadAll("ar");
    expect(ar.staff).toEqual({ title: "الطاقم" });
  });

  it("rejects duplicate namespace registration", () => {
    const reg = new I18nRegistry();
    reg.register("staff", async () => ({}));
    expect(() => reg.register("staff", async () => ({}))).toThrow(
      DuplicateI18nNamespaceError,
    );
  });
});
