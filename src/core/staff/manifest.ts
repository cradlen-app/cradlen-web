import type { Locale, ModuleManifest } from "@/common/kernel-contracts";

import { staffNav } from "./nav";
import { staffPermissions } from "./permissions";
import { STAFF_QUERY_KEY_ROOT } from "./queryKeys";

/**
 * Deliberately does NOT import from `./api`. The api re-exports React
 * client components (`StaffPage`, `StaffInviteAcceptance`, ...) that
 * cannot be loaded during kernel boot in non-DOM contexts (server
 * `getRequestConfig`, Vitest's Node test runs). Consumers of the staff
 * api use `import "@/core/staff/api"` directly.
 */
const staffManifest: ModuleManifest = {
  id: "staff",
  kind: "core",
  i18nNamespace: "staff",
  loadMessages: async (locale: Locale) => {
    switch (locale) {
      case "ar":
        return (await import("./messages/ar.json")).default;
      case "en":
      default:
        return (await import("./messages/en.json")).default;
    }
  },
  nav: staffNav,
  permissions: staffPermissions,
  queryKeyRoot: STAFF_QUERY_KEY_ROOT,
};

export default staffManifest;
