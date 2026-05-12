import { describe, expect, it } from "vitest";

import { ModuleRegistry } from "@/kernel";
import type { ModuleManifest } from "@/common/kernel-contracts";

import { mergeMessages } from "./mergeMessages";

function buildManifest(
  id: string,
  i18nNamespace: string,
  slice: Record<string, unknown>,
): ModuleManifest {
  return {
    id,
    kind: "core",
    i18nNamespace,
    loadMessages: async () => slice,
    nav: [],
    permissions: {},
    queryKeyRoot: [id],
  };
}

describe("mergeMessages", () => {
  it("wraps each registered slice under its module namespace and merges with base", async () => {
    const registry = new ModuleRegistry();
    registry.register(
      buildManifest("staff", "staff", {
        title: "Staff",
        nav: { label: "Staff" },
      }),
    );
    registry.register(buildManifest("billing", "billing", { title: "Billing" }));
    registry.freeze();

    const base = {
      common: { save: "Save" },
      nav: { dashboard: "Dashboard" },
    };

    const merged = await mergeMessages("en", base, registry);

    expect(merged).toMatchObject({
      common: { save: "Save" },
      nav: { dashboard: "Dashboard" },
      staff: { title: "Staff", nav: { label: "Staff" } },
      billing: { title: "Billing" },
    });
  });

  it("returns locale-specific slices", async () => {
    const localeRegistry = new ModuleRegistry();
    localeRegistry.register({
      id: "staff",
      kind: "core",
      i18nNamespace: "staff",
      loadMessages: async (locale) => ({
        title: locale === "ar" ? "الطاقم" : "Staff",
      }),
      nav: [],
      permissions: {},
      queryKeyRoot: ["staff"] as const,
    });
    localeRegistry.freeze();

    const en = await mergeMessages("en", {}, localeRegistry);
    const ar = await mergeMessages("ar", {}, localeRegistry);

    expect(en.staff).toEqual({ title: "Staff" });
    expect(ar.staff).toEqual({ title: "الطاقم" });
  });

  it("loads the real staff slice end-to-end", async () => {
    const staffManifest = (await import("@/core/staff/manifest")).default;
    const registry = new ModuleRegistry();
    registry.register(staffManifest);
    registry.freeze();

    const en = await mergeMessages("en", { common: { save: "Save" } }, registry);
    expect(en.common).toEqual({ save: "Save" });
    expect(en.staff).toBeDefined();
    const staffSlice = en.staff as Record<string, unknown>;
    expect((staffSlice.nav as { label: string }).label).toBe("Staff");
  });
});
