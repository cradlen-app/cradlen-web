/**
 * Client UI surface for the financial module: top-level page components
 * rendered by app routes, plus a small set of embedded components consumed by
 * other (not-yet-migrated) features — the visit workspace's `InvoiceDrawer`,
 * the reception visits page's `InvoicePanel` / `InvoicePanelButton`, and the
 * settings `BillingSection`.
 *
 * Kept separate from `api.ts` so non-UI consumers (route guards, server
 * helpers, tests) don't transitively load React client components.
 */

// ── Route pages ─────────────────────────────────────────────────────────────
export { ServicesPage } from "./components/ServicesPage";
export { InvoiceSearchPage } from "./components/InvoiceSearchPage";
export { CashSessionsPage } from "./components/CashSessionsPage";
export { ReportsPage } from "./components/ReportsPage";
export { InvoiceDetailPage } from "./components/InvoiceDetailPage";

// ── Embedded components consumed by other features ──────────────────────────
export { InvoicePanel } from "./components/InvoicePanel";
export { InvoicePanelButton } from "./components/InvoicePanelButton";
export { InvoiceDrawer } from "./components/InvoiceDrawer";
export { AddChargeDrawer } from "./components/AddChargeDrawer";
export { BillingSection } from "./components/settings/BillingSection";
