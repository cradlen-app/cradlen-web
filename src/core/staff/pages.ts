/**
 * Top-level page components rendered by app routes. Kept separate from
 * `api.ts` so that non-UI consumers (route guards, server helpers, tests)
 * don't transitively load React client components.
 */

export { StaffPage } from "./components/StaffPage";
export { StaffInvitationsPage } from "./components/StaffInvitationsPage";
export { StaffInviteAcceptance } from "./components/StaffInviteAcceptance";
