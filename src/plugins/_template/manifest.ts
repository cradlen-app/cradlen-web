import type { ModuleManifest } from "@/common/kernel-contracts";

const manifest: ModuleManifest = {
  id: "_template",
  kind: "plugin",
  i18nNamespace: "_template",
  loadMessages: async (locale) => {
    switch (locale) {
      case "ar":
        return (await import("./messages/ar.json")).default;
      case "en":
      default:
        return (await import("./messages/en.json")).default;
    }
  },
  nav: [],
  permissions: {},
  queryKeyRoot: ["_template"] as const,
};

export default manifest;
