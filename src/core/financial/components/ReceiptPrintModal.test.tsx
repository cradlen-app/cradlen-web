import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

import type { ReceiptPrint } from "../types/financial.types";

const { useReceiptPrintMock } = vi.hoisted(() => ({
  useReceiptPrintMock: vi.fn(),
}));

vi.mock("../hooks/useReceipts", () => ({
  useReceiptPrint: (id?: string) => useReceiptPrintMock(id),
}));

import { ReceiptPrintModal } from "./ReceiptPrintModal";

const RECEIPT: ReceiptPrint = {
  receipt_number: "RC-001",
  issued_at: "2026-06-10T10:00:00Z",
  status: "ISSUED",
  currency: "EGP",
  balance_after: "50.00",
  organization: { id: "org-1", name: "Cradlen Clinic", logo_object_key: null },
  branch: {
    id: "br-1",
    name: "Main Branch",
    address: "1 Nile St",
    city: "Cairo",
    governorate: "Cairo",
  },
  patient: { id: "pat-1", full_name: "Jane Roe", phone_number: "0100" },
  invoice: { id: "inv-1", invoice_number: "INV-1001", total_amount: "200.00" },
  payment: {
    id: "pay-1",
    amount: "150.00",
    payment_method: "CASH",
    payment_date: "2026-06-10T10:00:00Z",
  },
  issued_by: { id: "u1", name: "Reception Clerk" },
};

describe("ReceiptPrintModal", () => {
  beforeEach(() => {
    useReceiptPrintMock.mockReset();
  });

  it("shows the loading state while the receipt is being fetched", () => {
    useReceiptPrintMock.mockReturnValue({ receipt: undefined, isLoading: true });
    renderWithIntl(
      <ReceiptPrintModal open onOpenChange={vi.fn()} receiptId="rc-1" />,
    );
    expect(screen.getByText("Loading receipt…")).toBeInTheDocument();
  });

  it("renders the receipt details once loaded", () => {
    useReceiptPrintMock.mockReturnValue({ receipt: RECEIPT, isLoading: false });
    renderWithIntl(
      <ReceiptPrintModal open onOpenChange={vi.fn()} receiptId="rc-1" />,
    );
    expect(screen.getByText("Cradlen Clinic")).toBeInTheDocument();
    expect(screen.getByText("RC-001")).toBeInTheDocument();
    expect(screen.getByText("Reception Clerk")).toBeInTheDocument();
    expect(screen.getByText("Jane Roe")).toBeInTheDocument();
    expect(screen.getByText("EGP 150.00")).toBeInTheDocument();
    expect(screen.getByText("EGP 50.00")).toBeInTheDocument();
  });

  it("disables the print button until the receipt is available", () => {
    useReceiptPrintMock.mockReturnValue({ receipt: undefined, isLoading: true });
    renderWithIntl(
      <ReceiptPrintModal open onOpenChange={vi.fn()} receiptId="rc-1" />,
    );
    expect(screen.getByRole("button", { name: "Print" })).toBeDisabled();
  });

  it("passes undefined to the hook when the modal is closed (skips fetch)", () => {
    useReceiptPrintMock.mockReturnValue({ receipt: undefined, isLoading: false });
    renderWithIntl(
      <ReceiptPrintModal open={false} onOpenChange={vi.fn()} receiptId="rc-1" />,
    );
    expect(useReceiptPrintMock).toHaveBeenCalledWith(undefined);
  });

  it("invokes window.print when print is clicked with a loaded receipt", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
    useReceiptPrintMock.mockReturnValue({ receipt: RECEIPT, isLoading: false });
    renderWithIntl(
      <ReceiptPrintModal open onOpenChange={vi.fn()} receiptId="rc-1" />,
    );
    screen.getByRole("button", { name: "Print" }).click();
    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
