import type { InvoiceStatus } from "../types/financial.types";

/**
 * What the current user may do with an invoice, derived purely from its status.
 * Pure and framework-free so the transition rules are unit-testable without
 * mounting the detail page.
 */
export type InvoicePermissions = {
  canEdit: boolean;
  canIssue: boolean;
  canRecordPayment: boolean;
  canVoid: boolean;
  isPartiallyPaid: boolean;
};

export function getInvoicePermissions(
  status: InvoiceStatus | undefined,
): InvoicePermissions {
  return {
    canEdit: status === "DRAFT",
    canIssue: status === "DRAFT",
    canRecordPayment: status === "ISSUED" || status === "PARTIALLY_PAID",
    canVoid: status === "DRAFT",
    isPartiallyPaid: status === "PARTIALLY_PAID",
  };
}
