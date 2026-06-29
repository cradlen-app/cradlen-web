import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { refundMutate, isPending } = vi.hoisted(() => ({
  refundMutate: vi.fn(),
  isPending: { value: false },
}));

vi.mock("../hooks/useRefunds", () => ({
  useCreateRefund: () => ({ mutate: refundMutate, isPending: isPending.value }),
}));

import { RefundDrawer } from "./RefundDrawer";
import type { Payment } from "../types/financial.types";

const PAYMENT: Payment = {
  id: "pay-1",
  invoice_id: "inv-1",
  amount: 200,
  currency: "EGP",
  status: "COMPLETED",
  payment_method: "CASH",
  payment_date: "2026-06-10T00:00:00.000Z",
  reference_number: null,
  notes: null,
  recorded_by_id: "user-1",
  created_at: "2026-06-10T00:00:00.000Z",
  updated_at: "2026-06-10T00:00:00.000Z",
};

function renderDrawer(payment: Payment | null = PAYMENT) {
  const onOpenChange = vi.fn();
  renderWithIntl(
    <RefundDrawer
      open
      onOpenChange={onOpenChange}
      invoiceId="inv-1"
      payment={payment}
    />,
  );
  return { onOpenChange };
}

describe("RefundDrawer", () => {
  beforeEach(() => {
    refundMutate.mockReset();
    isPending.value = false;
  });

  it("shows the max refundable amount derived from the payment", () => {
    renderDrawer();
    expect(screen.getByText("Max EGP 200.00")).toBeInTheDocument();
  });

  it("blocks submit and shows an error when the reason is too short", () => {
    renderDrawer();
    fireEvent.change(screen.getByPlaceholderText(/Reason for the refund/i), {
      target: { value: "no" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue Refund" }));
    expect(
      screen.getByText("Please enter at least 4 characters."),
    ).toBeInTheDocument();
    expect(refundMutate).not.toHaveBeenCalled();
  });

  it("defaults the refund amount to the full payment when left blank", () => {
    refundMutate.mockImplementation(
      (_payload: unknown, opts: { onSuccess: () => void }) => opts.onSuccess(),
    );
    const { onOpenChange } = renderDrawer();

    fireEvent.change(screen.getByPlaceholderText(/Reason for the refund/i), {
      target: { value: "Duplicate charge" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue Refund" }));

    expect(refundMutate).toHaveBeenCalledWith(
      { payment_id: "pay-1", amount: 200, reason: "Duplicate charge" },
      expect.any(Object),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("sends a partial refund amount when provided", () => {
    renderDrawer();
    fireEvent.change(screen.getByPlaceholderText("EGP 200.00"), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Reason for the refund/i), {
      target: { value: "Partial refund" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Issue Refund" }));

    expect(refundMutate).toHaveBeenCalledWith(
      { payment_id: "pay-1", amount: 50, reason: "Partial refund" },
      expect.any(Object),
    );
  });

  it("no-ops the submit when there is no payment", () => {
    renderDrawer(null);
    fireEvent.click(screen.getByRole("button", { name: "Issue Refund" }));
    expect(refundMutate).not.toHaveBeenCalled();
  });
});
