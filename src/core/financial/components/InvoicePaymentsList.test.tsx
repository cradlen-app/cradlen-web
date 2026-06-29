import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoicePaymentsList } from "./InvoicePaymentsList";
import type { Payment, Receipt } from "../types/financial.types";

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    invoice_id: "inv-1",
    amount: 200,
    currency: "EGP",
    status: "COMPLETED",
    payment_method: "CASH",
    payment_date: "2026-06-10T00:00:00.000Z",
    reference_number: "TXN-1",
    notes: null,
    recorded_by_id: "user-1",
    recorded_by: { id: "user-1", full_name: "Reception A" },
    created_at: "2026-06-10T00:00:00.000Z",
    updated_at: "2026-06-10T00:00:00.000Z",
    ...overrides,
  };
}

function renderList(
  overrides: Partial<React.ComponentProps<typeof InvoicePaymentsList>> = {},
) {
  const onPrintReceipt = vi.fn();
  const onRefund = vi.fn();
  const onVoidPayment = vi.fn();
  renderWithIntl(
    <InvoicePaymentsList
      payments={[makePayment()]}
      loading={false}
      receiptByPayment={new Map()}
      onPrintReceipt={onPrintReceipt}
      onRefund={onRefund}
      onVoidPayment={onVoidPayment}
      {...overrides}
    />,
  );
  return { onPrintReceipt, onRefund, onVoidPayment };
}

describe("InvoicePaymentsList", () => {
  it("shows the empty state when there are no payments", () => {
    renderList({ payments: [] });
    expect(screen.getByText("No payments recorded yet")).toBeInTheDocument();
  });

  it("renders a payment row with amount, method and recorder", () => {
    renderList();
    expect(screen.getByText("EGP 200.00")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Reception A")).toBeInTheDocument();
  });

  it("offers Refund + Void for a completed payment and fires the callbacks", () => {
    const { onRefund, onVoidPayment } = renderList();
    fireEvent.click(screen.getByRole("button", { name: "Refund" }));
    fireEvent.click(screen.getByRole("button", { name: "Void" }));
    expect(onRefund).toHaveBeenCalledWith(expect.objectContaining({ id: "pay-1" }));
    expect(onVoidPayment).toHaveBeenCalledWith(
      expect.objectContaining({ id: "pay-1" }),
    );
  });

  it("hides the Refund action for a non-completed payment", () => {
    renderList({ payments: [makePayment({ status: "VOID" })] });
    expect(screen.queryByRole("button", { name: "Refund" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Void" })).not.toBeInTheDocument();
  });

  it("shows the receipt action and prints the matched receipt", () => {
    const receipt = { id: "rec-1" } as Receipt;
    const { onPrintReceipt } = renderList({
      receiptByPayment: new Map([["pay-1", receipt]]),
    });
    fireEvent.click(screen.getByRole("button", { name: "Receipt" }));
    expect(onPrintReceipt).toHaveBeenCalledWith("rec-1");
  });

  it("shows skeletons while loading", () => {
    renderList({ loading: true, payments: [] });
    // No empty-state copy while loading.
    expect(screen.queryByText("No payments recorded yet")).not.toBeInTheDocument();
  });
});
