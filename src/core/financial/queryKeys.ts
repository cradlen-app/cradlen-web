import type {
  InvoiceFilters,
  ServiceFilters,
} from "./types/financial.types";

/**
 * Owned TanStack Query namespace for the financial module.
 *
 * Other modules consume these keys via `@/core/financial/api`
 * (financialQueryKeys). Internal financial files import directly from here.
 *
 * The kernel verifies that no other module claims the `financial` root key
 * (see ModuleRegistry registration via manifest.queryKeyRoot).
 */
export const financialQueryKeys = {
  /** Broad key — matches every financial query. */
  all: () => ["financial"] as const,

  // ── Invoicing ─────────────────────────────────────────────────────────────
  invoices: {
    all: () => ["financial", "invoices"] as const,
    list: (orgId: string, filters: InvoiceFilters) =>
      ["financial", "invoices", "list", orgId, filters] as const,
    byId: (id: string) => ["financial", "invoices", "detail", id] as const,
    payments: (id: string) =>
      ["financial", "invoices", "payments", id] as const,
    forVisit: (visitId: string) =>
      ["financial", "invoices", "visit", visitId] as const,
  },

  // ── Catalog (services + categories) ───────────────────────────────────────
  services: {
    all: () => ["financial", "services"] as const,
    list: (orgId: string, filters?: ServiceFilters) =>
      ["financial", "services", "list", orgId, filters ?? null] as const,
    byId: (id: string) => ["financial", "services", "detail", id] as const,
  },
  categories: {
    all: () => ["financial", "categories"] as const,
    list: (orgId: string) => ["financial", "categories", "list", orgId] as const,
  },

  // ── Pricing ───────────────────────────────────────────────────────────────
  pricing: {
    priceLists: (orgId: string, branchId?: string) =>
      ["financial", "price-lists", orgId, branchId ?? null] as const,
    priceListItems: (priceListId: string) =>
      ["financial", "price-list-items", priceListId] as const,
    resolvedPrice: (
      orgId: string,
      serviceId: string,
      branchId: string,
      profileId?: string,
    ) =>
      [
        "financial",
        "resolved-price",
        orgId,
        serviceId,
        branchId,
        profileId ?? null,
      ] as const,
    providerServices: (orgId: string, profileId: string) =>
      ["financial", "provider-services", orgId, profileId] as const,
    providerOverrides: (orgId: string, profileId: string) =>
      ["financial", "provider-overrides", orgId, profileId] as const,
  },

  // ── Charging ──────────────────────────────────────────────────────────────
  charges: {
    all: () => ["financial", "charges"] as const,
    list: (orgId: string, opts?: { status?: string; visitId?: string }) =>
      ["financial", "charges", "list", orgId, opts ?? null] as const,
    byVisit: (visitId: string) =>
      ["financial", "charges", "visit", visitId] as const,
  },

  // ── Refunds ───────────────────────────────────────────────────────────────
  refunds: {
    all: () => ["financial", "refunds"] as const,
    list: (orgId: string, opts?: { status?: string; paymentId?: string }) =>
      ["financial", "refunds", "list", orgId, opts ?? null] as const,
    byId: (id: string) => ["financial", "refunds", "detail", id] as const,
  },

  // ── Receipts ──────────────────────────────────────────────────────────────
  receipts: {
    all: () => ["financial", "receipts"] as const,
    byId: (id: string) => ["financial", "receipts", "detail", id] as const,
    print: (id: string) => ["financial", "receipts", "print", id] as const,
  },

  // ── Cash management ───────────────────────────────────────────────────────
  cashSessions: {
    all: () => ["financial", "cash-sessions"] as const,
    list: (orgId: string, branchId?: string) =>
      ["financial", "cash-sessions", "list", orgId, branchId ?? null] as const,
    current: (orgId: string, branchId: string) =>
      ["financial", "cash-sessions", "current", orgId, branchId] as const,
    byId: (id: string) =>
      ["financial", "cash-sessions", "detail", id] as const,
  },

  // ── Settings reference data ───────────────────────────────────────────────
  /** Org branch list shared by the price-list and authorization settings editors. */
  branches: (orgId: string) => ["financial", "branches", orgId] as const,

  // ── Reporting ─────────────────────────────────────────────────────────────
  reports: {
    all: () => ["financial", "reports"] as const,
    report: (
      name: string,
      orgId: string,
      params?: Record<string, unknown>,
    ) => ["financial", "reports", name, orgId, params ?? null] as const,
  },
} as const;

/** Root key registered with the kernel's QueryKeyRegistry. */
export const FINANCIAL_QUERY_KEY_ROOT = ["financial"] as const;
