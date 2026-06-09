import type { Locale, ModuleManifest } from "@/common/kernel-contracts";

import { financialNav } from "./nav";
import { financialPermissions } from "./permissions";
import { FINANCIAL_QUERY_KEY_ROOT } from "./queryKeys";

/**
 * Deliberately does NOT import from `./api`. The api re-exports React client
 * hooks/components that cannot be loaded during kernel boot in non-DOM
 * contexts (server `getRequestConfig`, Vitest's Node runs). Consumers of the
 * financial api use `import "@/core/financial/api"` directly.
 */
const financialManifest: ModuleManifest = {
  id: "financial",
  kind: "core",
  i18nNamespace: "financial",
  loadMessages: async (locale: Locale) => {
    switch (locale) {
      case "ar":
        return (await import("./messages/ar.json")).default;
      case "en":
      default:
        return (await import("./messages/en.json")).default;
    }
  },
  nav: financialNav,
  permissions: financialPermissions,
  queryKeyRoot: FINANCIAL_QUERY_KEY_ROOT,
};

export default financialManifest;
