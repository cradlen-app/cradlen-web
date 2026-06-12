import { useMemo } from "react";
import { useInvoice } from "./useInvoice";
import { usePayments } from "./usePayments";
import { useReceipts } from "./useReceipts";
import { useRefunds, useVoidRefund } from "./useRefunds";
import { useVoidPayment } from "./useVoidPayment";
import { useIssueInvoice } from "./useIssueInvoice";
import { getInvoicePermissions } from "../lib/invoiceActions";

/**
 * Aggregates everything the invoice detail view needs — the invoice + its
 * payments/receipts/refunds, the issue/void mutations, the per-payment receipt
 * lookup, and the status-derived permissions — behind a single hook. Keeps the
 * page a presentational consumer instead of an orchestrator of seven hooks.
 */
export function useInvoiceDetail(invoiceId: string) {
  const { invoice, isLoading } = useInvoice(invoiceId);
  const { payments, isLoading: paymentsLoading } = usePayments(invoiceId);
  const { receipts } = useReceipts(invoiceId);
  const { refunds } = useRefunds(invoiceId);

  const voidPaymentMutation = useVoidPayment(invoiceId);
  const voidRefundMutation = useVoidRefund(invoiceId);
  const issueMutation = useIssueInvoice();

  // payment_id → receipt, for surfacing a "Receipt" action per payment row.
  const receiptByPayment = useMemo(
    () => new Map(receipts.map((r) => [r.payment_id, r])),
    [receipts],
  );

  const permissions = getInvoicePermissions(invoice?.status);

  return {
    invoice,
    isLoading,
    payments,
    paymentsLoading,
    refunds,
    receiptByPayment,
    permissions,
    issueMutation,
    voidPaymentMutation,
    voidRefundMutation,
  };
}
