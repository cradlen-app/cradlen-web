import { describe, expect, it } from "vitest";

import type {
  AuthContext,
  AuthProfile,
  ModuleManifest,
  NavItem,
} from "@/common/kernel-contracts";

import {
  DuplicateModuleError,
  ModuleRegistry,
  RegistryFrozenError,
} from "./ModuleRegistry";

function makeManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  return {
    id: "staff",
    kind: "core",
    i18nNamespace: "staff",
    loadMessages: async () => ({ title: "Staff" }),
    nav: [],
    permissions: {},
    queryKeyRoot: ["staff"] as const,
    ...overrides,
  };
}

const anonCtx: AuthContext = {
  user: null,
  profile: null,
  orgId: null,
  branchId: null,
};

describe("ModuleRegistry", () => {
  it("registers a module and exposes it via get/has/list", () => {
    const reg = new ModuleRegistry();
    reg.register(makeManifest());
    expect(reg.has("staff")).toBe(true);
    expect(reg.get("staff")?.id).toBe("staff");
    expect(reg.list()).toHaveLength(1);
  });

  it("rejects duplicate module ids", () => {
    const reg = new ModuleRegistry();
    reg.register(makeManifest());
    expect(() => reg.register(makeManifest())).toThrow(DuplicateModuleError);
  });

  it("forwards permissions, nav items, query roots, and i18n loaders on registration", () => {
    const reg = new ModuleRegistry();
    const item: NavItem = {
      id: "staff-nav",
      labelKey: "staff.nav.title",
      path: "/staff",
      requiresPermission: "staff.read",
    };
    reg.register(
      makeManifest({
        nav: [item],
        permissions: { "staff.read": (ctx) => ctx.profile?.role === "owner" },
      }),
    );

    expect(reg.permissions.has("staff.read")).toBe(true);
    expect(reg.permissions.check("staff.read", anonCtx)).toBe(false);
    expect(
      reg.permissions.check("staff.read", {
        ...anonCtx,
        profile: { id: "p", role: "owner" } as unknown as AuthProfile,
      }),
    ).toBe(true);
    expect(reg.nav.list()).toHaveLength(1);
    expect(reg.nav.list()[0].ownerModuleId).toBe("staff");
    expect(reg.queryKeys.ownerOf("staff")).toBe("staff");
    expect(reg.i18n.namespaces()).toContain("staff");
  });

  it("freezes and rejects further registration", () => {
    const reg = new ModuleRegistry();
    reg.register(makeManifest());
    reg.freeze();
    expect(reg.isFrozen).toBe(true);
    expect(() => reg.register(makeManifest({ id: "other" }))).toThrow(
      RegistryFrozenError,
    );
    expect(() => reg.registerLegacyNav([])).toThrow(RegistryFrozenError);
  });

  it("accepts legacy nav before freeze", () => {
    const reg = new ModuleRegistry();
    const legacy: NavItem = {
      id: "patients-legacy",
      labelKey: "nav.patients",
      path: "/patients",
    };
    reg.registerLegacyNav([legacy]);
    expect(reg.nav.list()).toHaveLength(1);
    expect(reg.nav.list()[0].ownerModuleId).toBe("__legacy__");
  });
});
