import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";

const { recordMutate, useCurrentCashSession } = vi.hoisted(() => ({
  recordMutate: vi.fn(),
  useCurrentCashSession: vi.fn(),
}));

vi.mock("../hooks/useRecordPayment", () => ({
  useRecordPayment: () => ({ mutate: recordMutate, isPending: false }),
}));

vi.mock("../hooks/useCashSessions", () => ({
  useCurrentCashSession: () => useCurrentCashSession(),
}));

vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath:
    () =>
    (path = "") =>
      `/org-1/branch-1/dashboard${path}`,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { RecordPaymentDrawer } from "./RecordPaymentDrawer";

function renderDrawer() {
  return renderWithIntl(
    <RecordPaymentDrawer
      open
      onOpenChange={vi.fn()}
      invoiceId="inv-1"
      outstandingAmount={100}
    />,
  );
}

describe("RecordPaymentDrawer — cash-session gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks recording when no cash session is open", () => {
    useCurrentCashSession.mockReturnValue({ session: null, isLoading: false });

    renderDrawer();

    expect(screen.getByText(/no cash session open/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled();
    const link = screen.getByRole("link", { name: /open cash session/i });
    expect(link).toHaveAttribute(
      "href",
      "/org-1/branch-1/dashboard/financial/cash-sessions",
    );
  });

  it("keeps recording disabled (no banner) while the session is loading", () => {
    useCurrentCashSession.mockReturnValue({ session: null, isLoading: true });

    renderDrawer();

    expect(screen.queryByText(/no cash session open/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /record payment/i })).toBeDisabled();
  });

  it("allows recording and attributes cash to the open session", async () => {
    useCurrentCashSession.mockReturnValue({
      session: { id: "sess-1", status: "OPEN" },
      isLoading: false,
    });

    renderDrawer();

    expect(screen.queryByText(/no cash session open/i)).not.toBeInTheDocument();
    const record = screen.getByRole("button", { name: /record payment/i });
    expect(record).toBeEnabled();

    fireEvent.click(record);

    await waitFor(() => expect(recordMutate).toHaveBeenCalledTimes(1));
    const arg = recordMutate.mock.calls[0][0];
    expect(arg.invoiceId).toBe("inv-1");
    expect(arg.payload.payment_method).toBe("CASH");
    // The client no longer sends cash_session_id — the server resolves and
    // attributes the session itself.
    expect(arg.payload).not.toHaveProperty("cash_session_id");
  });
});
