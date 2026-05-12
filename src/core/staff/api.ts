/**
 * Staff module public surface — non-page exports.
 *
 * External callers (other core modules, plugins, app routes) consume the
 * staff module via this file (data/types/hooks/predicates) and the sibling
 * `pages.ts` (route-mounted UI components). The split keeps the data api
 * importable from server-side / Node contexts without dragging in React
 * client components.
 */

export { useStaff } from "./hooks/useStaff";
export type { StaffMember } from "./types/staff.types";

export { staffQueryKeys, STAFF_QUERY_KEY_ROOT } from "./queryKeys";

/**
 * `staffCan.{read,manage,editRoles,delete}(profile)` — pure helpers for
 * non-React callers. React components should prefer `usePermission('staff.*')`
 * from `@/kernel`.
 */
export { staffCan } from "./permissions";
