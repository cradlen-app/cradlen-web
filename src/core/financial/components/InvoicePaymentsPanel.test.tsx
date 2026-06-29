import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import type { Payment, Receipt } from "../types/financial.types";

const { usePaymentsMock, useReceiptsMock, useVoidPaymentMock } = vi.hoisted(
  () => ({
    usePaymentsMock: vi.fn(),
    useReceiptsMock: vi.fn(),
    useVoidPaymentMock: vi.fn(),
  }),
);

vi.mock("../hooks/usePayments", () => ({
  usePayments: (id: string) => usePaymentsMock(id),
}));
vi.mock("../hooks/useReceipts", () => ({
  useReceipts: (id: string) => useReceiptsMock(id),
  useReceiptPrint: () => ({ receipt: null, isLoading: false }),
}));
vi.mock("../hooks/useVoidPayment", () => ({
  useVoidPayment: (id: string) => useVoidPaymentMock(id),
}));
// RefundDrawer pulls its own data wiring; stub it out (it stays closed here).
vi.mock("./RefundDrawer", () => ({
  RefundDrawer: ({ open }: { open: boolean }) =>
    open ? <div data-testid="refund-drawer" /> : null,
}));

import { InvoicePaymentsPanel } from "./InvoicePaymentsPanel";

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    invoice_id: "inv-1",
    amount: 150,
    currency: "EGP",
    status: "COMPLETED",
    payment_method: "CASH",
    payment_date: "2026-06-10",
    reference_number: "REF-9",
    notes: null,
    recorded_by_id: "u1",
    created_at: "2026-06-10",
    updated_at: "2026-06-10",
    ...overrides,
  };
}

const voidMutation = { mutate: vi.fn() };

beforeEach(() => {
  usePaymentsMock.mockReset();
  useReceiptsMock.mockReset();
  useVoidPaymentMock.mockReset();
  voidMutation.mutate.mockReset();
  useVoidPaymentMock.mockReturnValue(voidMutation);
  useReceiptsMock.mockReturnValue({ receipts: [] });
});

describe("InvoicePaymentsPanel", () => {
  it("shows the loading state", () => {
    usePaymentsMock.mockReturnValue({ payments: [], isLoading: true });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    expect(screen.getByText("Loading payments…")).toBeInTheDocument();
  });

  it("shows the empty state when there are no payments", () => {
    usePaymentsMock.mockReturnValue({ payments: [], isLoading: false });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    expect(screen.getByText("No payments yet.")).toBeInTheDocument();
  });

  it("renders a payment row with amount, method and reference", () => {
    usePaymentsMock.mockReturnValue({ payments: [payment()], isLoading: false });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    expect(screen.getByText("EGP 150.00")).toBeInTheDocument();
    expect(screen.getByText(/Cash/)).toBeInTheDocument();
    expect(screen.getByText(/REF-9/)).toBeInTheDocument();
  });

  it("shows refund and void actions for a completed payment", () => {
    usePaymentsMock.mockReturnValue({ payments: [payment()], isLoading: false });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    expect(screen.getByRole("button", { name: "Refund" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Void" })).toBeInTheDocument();
  });

  it("opens the refund drawer when refund is clicked", () => {
    usePaymentsMock.mockReturnValue({ payments: [payment()], isLoading: false });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    fireEvent.click(screen.getByRole("button", { name: "Refund" }));
    expect(screen.getByTestId("refund-drawer")).toBeInTheDocument();
  });

  it("shows the receipt action when a receipt exists for the payment", () => {
    const receipt = { id: "rc-1", payment_id: "pay-1" } as unknown as Receipt;
    useReceiptsMock.mockReturnValue({ receipts: [receipt] });
    usePaymentsMock.mockReturnValue({ payments: [payment()], isLoading: false });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    expect(screen.getByRole("button", { name: "Receipt" })).toBeInTheDocument();
  });

  it("voids a payment through the confirm dialog", () => {
    usePaymentsMock.mockReturnValue({ payments: [payment()], isLoading: false });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);

    fireEvent.click(screen.getByRole("button", { name: "Void" }));
    // ConfirmDialog renders; confirm with its action label "Void"
    const confirmButtons = screen.getAllByRole("button", { name: "Void" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
    expect(voidMutation.mutate).toHaveBeenCalledWith("pay-1", expect.any(Object));
  });

  it("hides refund/void actions for a non-completed payment", () => {
    usePaymentsMock.mockReturnValue({
      payments: [payment({ status: "VOID" })],
      isLoading: false,
    });
    renderWithIntl(<InvoicePaymentsPanel invoiceId="inv-1" currency="EGP" />);
    expect(screen.queryByRole("button", { name: "Refund" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Void" })).not.toBeInTheDocument();
  });
});
