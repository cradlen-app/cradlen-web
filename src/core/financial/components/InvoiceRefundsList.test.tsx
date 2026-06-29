import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import { InvoiceRefundsList } from "./InvoiceRefundsList";
import type { Refund } from "../types/financial.types";

function refund(overrides: Partial<Refund> = {}): Refund {
  return {
    id: "rf-1",
    payment_id: "pay-1",
    amount: "150.00",
    reason: "Overcharged the patient",
    status: "COMPLETED",
    refunded_by_id: "u1",
    refunded_at: "2026-06-10",
    created_at: "2026-06-10",
    ...overrides,
  };
}

describe("InvoiceRefundsList", () => {
  it("renders nothing when there are no refunds", () => {
    const { container } = renderWithIntl(
      <InvoiceRefundsList refunds={[]} currency="EGP" onVoidRefund={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders refund rows with amount, reason and status", () => {
    renderWithIntl(
      <InvoiceRefundsList refunds={[refund()]} currency="EGP" onVoidRefund={vi.fn()} />,
    );
    expect(screen.getByText("Refunds")).toBeInTheDocument();
    expect(screen.getByText("EGP 150.00")).toBeInTheDocument();
    expect(screen.getByText("Overcharged the patient")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("hides the reason column in dense mode", () => {
    renderWithIntl(
      <InvoiceRefundsList refunds={[refund()]} currency="EGP" dense onVoidRefund={vi.fn()} />,
    );
    expect(screen.queryByText("Overcharged the patient")).not.toBeInTheDocument();
  });

  it("fires onVoidRefund for non-void refunds and hides the action for void ones", () => {
    const onVoidRefund = vi.fn();
    renderWithIntl(
      <InvoiceRefundsList
        refunds={[refund(), refund({ id: "rf-2", status: "VOID" })]}
        currency="EGP"
        onVoidRefund={onVoidRefund}
      />,
    );
    const voidButtons = screen.getAllByRole("button", { name: "Void refund" });
    expect(voidButtons).toHaveLength(1);
    fireEvent.click(voidButtons[0]);
    expect(onVoidRefund).toHaveBeenCalledWith(expect.objectContaining({ id: "rf-1" }));
  });
});
