import type { ModuleManifest } from "@/common/kernel-contracts";

import { shellNav } from "./nav";
import { shellPermissions } from "./permissions";
import { SHELL_QUERY_KEY_ROOT } from "./queryKeys";

/**
 * Transitional "shell" module. Contributes the top-level operational nav
 * (dashboard, visits, calendar, patients, medicine, medical-rep, analytics)
 * and their visibility permissions while those features still live under
 * `src/features/*`. Labels reuse the global `nav.*` keys, so `loadMessages`
 * contributes nothing. As each feature migrates to `src/core/<module>`, its
 * nav item + permission moves there, shrinking this module until it's empty.
 */
const shellManifest: ModuleManifest = {
  id: "shell",
  kind: "core",
  i18nNamespace: "shell",
  loadMessages: async () => ({}),
  nav: shellNav,
  permissions: shellPermissions,
  queryKeyRoot: SHELL_QUERY_KEY_ROOT,
};

export default shellManifest;
