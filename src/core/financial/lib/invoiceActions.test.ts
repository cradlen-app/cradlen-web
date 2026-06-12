import { describe, expect, it } from "vitest";
import { getInvoicePermissions } from "./invoiceActions";

describe("getInvoicePermissions", () => {
  it("DRAFT can be edited, issued and voided but not paid", () => {
    expect(getInvoicePermissions("DRAFT")).toEqual({
      canEdit: true,
      canIssue: true,
      canRecordPayment: false,
      canVoid: true,
      isPartiallyPaid: false,
    });
  });

  it("ISSUED can only record a payment", () => {
    expect(getInvoicePermissions("ISSUED")).toEqual({
      canEdit: false,
      canIssue: false,
      canRecordPayment: true,
      canVoid: false,
      isPartiallyPaid: false,
    });
  });

  it("PARTIALLY_PAID can record a payment and is flagged partial", () => {
    const p = getInvoicePermissions("PARTIALLY_PAID");
    expect(p.canRecordPayment).toBe(true);
    expect(p.isPartiallyPaid).toBe(true);
    expect(p.canEdit).toBe(false);
  });

  it("PAID / VOID / undefined allow no actions", () => {
    for (const status of ["PAID", "VOID", undefined] as const) {
      expect(getInvoicePermissions(status)).toEqual({
        canEdit: false,
        canIssue: false,
        canRecordPayment: false,
        canVoid: false,
        isPartiallyPaid: false,
      });
    }
  });
});
