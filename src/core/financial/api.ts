/**
 * Financial module public surface — non-page exports.
 *
 * External callers (other core modules, plugins, app routes, route guards,
 * tests) consume the financial module via this file (data/types/hooks/
 * predicates) and the sibling `pages.ts` (route-mounted UI components). The
 * split keeps the data api importable from server-side / Node contexts without
 * dragging in React client components.
 */

export { financialQueryKeys, FINANCIAL_QUERY_KEY_ROOT } from "./queryKeys";

/**
 * `financialCan.{...}(profile)` — pure helpers for non-React callers. React
 * components should prefer `usePermission('financial.*')` from `@/kernel`.
 */
export { financialCan } from "./permissions";

// ── Data hooks (read) ───────────────────────────────────────────────────────
export { useInvoices } from "./hooks/useInvoices";
export { useEpisodeInvoice } from "./hooks/useEpisodeInvoice";
export { useBillingQueue, type BillingQueueItem } from "./hooks/useBillingQueue";
export { useInvoice } from "./hooks/useInvoice";
export { usePayments } from "./hooks/usePayments";
export { useServices } from "./hooks/useServices";
export { usePriceLists } from "./hooks/usePriceLists";
export { useResolvePrice } from "./hooks/useResolvePrice";

// ── Formatting helpers ──────────────────────────────────────────────────────
export { formatMoney } from "./lib/format";

export type * from "./types/financial.types";
