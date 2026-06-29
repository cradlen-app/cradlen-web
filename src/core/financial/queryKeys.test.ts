import { describe, expect, it } from "vitest";
import { financialQueryKeys } from "./queryKeys";

describe("financialQueryKeys", () => {
  it("exposes the broad root key", () => {
    expect(financialQueryKeys.all()).toEqual(["financial"]);
  });

  describe("invoices", () => {
    it("builds list/detail/payments/forVisit keys", () => {
      expect(financialQueryKeys.invoices.all()).toEqual(["financial", "invoices"]);
      expect(
        financialQueryKeys.invoices.list("org-1", { status: "ISSUED" }),
      ).toEqual(["financial", "invoices", "list", "org-1", { status: "ISSUED" }]);
      expect(financialQueryKeys.invoices.byId("inv-1")).toEqual([
        "financial",
        "invoices",
        "detail",
        "inv-1",
      ]);
      expect(financialQueryKeys.invoices.payments("inv-1")).toEqual([
        "financial",
        "invoices",
        "payments",
        "inv-1",
      ]);
      expect(financialQueryKeys.invoices.forVisit("v-1")).toEqual([
        "financial",
        "invoices",
        "visit",
        "v-1",
      ]);
    });
  });

  describe("services & categories", () => {
    it("defaults service filters to null", () => {
      expect(financialQueryKeys.services.list("org-1")).toEqual([
        "financial",
        "services",
        "list",
        "org-1",
        null,
      ]);
      expect(
        financialQueryKeys.services.list("org-1", { active: true }),
      ).toEqual(["financial", "services", "list", "org-1", { active: true }]);
      expect(financialQueryKeys.services.byId("s-1")).toEqual([
        "financial",
        "services",
        "detail",
        "s-1",
      ]);
      expect(financialQueryKeys.categories.list("org-1")).toEqual([
        "financial",
        "categories",
        "list",
        "org-1",
      ]);
    });
  });

  describe("pricing", () => {
    it("normalizes optional branch/profile to null", () => {
      expect(financialQueryKeys.pricing.priceLists("org-1")).toEqual([
        "financial",
        "price-lists",
        "org-1",
        null,
      ]);
      expect(financialQueryKeys.pricing.priceLists("org-1", "b-1")).toEqual([
        "financial",
        "price-lists",
        "org-1",
        "b-1",
      ]);
      expect(
        financialQueryKeys.pricing.resolvedPrice("org-1", "svc-1", "b-1"),
      ).toEqual(["financial", "resolved-price", "org-1", "svc-1", "b-1", null]);
      expect(
        financialQueryKeys.pricing.resolvedPrice("org-1", "svc-1", "b-1", "p-1"),
      ).toEqual(["financial", "resolved-price", "org-1", "svc-1", "b-1", "p-1"]);
      expect(financialQueryKeys.pricing.providerServices("org-1", "p-1")).toEqual([
        "financial",
        "provider-services",
        "org-1",
        "p-1",
      ]);
    });
  });

  describe("charges / refunds / receipts / cash / reports", () => {
    it("builds charge keys with optional opts defaulting to null", () => {
      expect(financialQueryKeys.charges.list("org-1")).toEqual([
        "financial",
        "charges",
        "list",
        "org-1",
        null,
      ]);
      expect(financialQueryKeys.charges.byVisit("v-1")).toEqual([
        "financial",
        "charges",
        "visit",
        "v-1",
      ]);
    });

    it("builds refund keys", () => {
      expect(financialQueryKeys.refunds.list("org-1", { status: "X" })).toEqual([
        "financial",
        "refunds",
        "list",
        "org-1",
        { status: "X" },
      ]);
      expect(financialQueryKeys.refunds.byId("r-1")).toEqual([
        "financial",
        "refunds",
        "detail",
        "r-1",
      ]);
    });

    it("builds receipt keys", () => {
      expect(financialQueryKeys.receipts.byId("rc-1")).toEqual([
        "financial",
        "receipts",
        "detail",
        "rc-1",
      ]);
      expect(financialQueryKeys.receipts.print("rc-1")).toEqual([
        "financial",
        "receipts",
        "print",
        "rc-1",
      ]);
    });

    it("builds cash-session keys", () => {
      expect(financialQueryKeys.cashSessions.current("org-1", "b-1")).toEqual([
        "financial",
        "cash-sessions",
        "current",
        "org-1",
        "b-1",
      ]);
      expect(financialQueryKeys.cashSessions.list("org-1")).toEqual([
        "financial",
        "cash-sessions",
        "list",
        "org-1",
        null,
      ]);
    });

    it("builds the branches reference key", () => {
      expect(financialQueryKeys.branches("org-1")).toEqual([
        "financial",
        "branches",
        "org-1",
      ]);
    });
  });
});
