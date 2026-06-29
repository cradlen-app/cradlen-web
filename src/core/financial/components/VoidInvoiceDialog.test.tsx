import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { voidMutate, isPending } = vi.hoisted(() => ({
  voidMutate: vi.fn(),
  isPending: { value: false },
}));

vi.mock("../hooks/useVoidInvoice", () => ({
  useVoidInvoice: () => ({ mutate: voidMutate, isPending: isPending.value }),
}));

import { VoidInvoiceDialog } from "./VoidInvoiceDialog";

describe("VoidInvoiceDialog", () => {
  beforeEach(() => {
    voidMutate.mockReset();
    isPending.value = false;
  });

  it("renders the void confirmation copy", () => {
    renderWithIntl(
      <VoidInvoiceDialog open onOpenChange={() => {}} invoiceId="inv-1" />,
    );
    expect(screen.getByText("Void Invoice?")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Void Invoice" }),
    ).toBeInTheDocument();
  });

  it("voids the invoice by id and runs the success callbacks", () => {
    const onOpenChange = vi.fn();
    const onSuccess = vi.fn();
    voidMutate.mockImplementation((_id: string, opts: { onSuccess: () => void }) =>
      opts.onSuccess(),
    );
    renderWithIntl(
      <VoidInvoiceDialog
        open
        onOpenChange={onOpenChange}
        invoiceId="inv-1"
        onSuccess={onSuccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Void Invoice" }));

    expect(voidMutate).toHaveBeenCalledWith("inv-1", expect.any(Object));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it("disables the confirm button while pending", () => {
    isPending.value = true;
    renderWithIntl(
      <VoidInvoiceDialog open onOpenChange={() => {}} invoiceId="inv-1" />,
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
  });
});
