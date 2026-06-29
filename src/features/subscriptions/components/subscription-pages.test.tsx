import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { renderWithIntl } from "@/test/render";
import type { SubscriptionPayment } from "../lib/subscriptions.types";
import {
  useCancelPayment,
  usePayment,
  usePayments,
  useRemoveProof,
} from "../hooks/useSubscription";
import { PaymentsListPage } from "./PaymentsListPage";
import { PaymentDetailPage } from "./PaymentDetailPage";

const { MockApiError } = vi.hoisted(() => {
  class MockApiError extends Error {
    public messages: string[];
    constructor(public status: number, message: string | string[]) {
      const messages = Array.isArray(message) ? message : [message];
      super(messages.join("\n"));
      this.messages = messages;
    }
  }
  return { MockApiError };
});

vi.mock("@/common/errors/api-error", () => ({ ApiError: MockApiError }));
vi.mock("@/infrastructure/http/api", () => ({ ApiError: MockApiError }));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p = "") => p,
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={String(href)}>{children}</a>
  ),
}));

vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { id: "u1", profiles: [] } }),
}));

vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ organization: { id: "org-1" } }),
}));

vi.mock("../hooks/useSubscription", () => ({
  usePayments: vi.fn(),
  usePayment: vi.fn(),
  useCancelPayment: vi.fn(),
  useRemoveProof: vi.fn(),
}));

vi.mock("./ProofUploader", () => ({
  ProofUploader: () => <div data-testid="proof-uploader" />,
}));

function makePayment(
  overrides: Partial<SubscriptionPayment> = {},
): SubscriptionPayment {
  return {
    id: "pay-1",
    amount: "12000",
    currency: "EGP",
    purpose: "PLAN",
    provider: "INSTAPAY",
    status: "PENDING",
    created_at: "2026-01-01T00:00:00.000Z",
    proofs: [],
    items: [],
    ...overrides,
  } as SubscriptionPayment;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PaymentsListPage", () => {
  function mockPayments(value: Partial<ReturnType<typeof usePayments>>) {
    vi.mocked(usePayments).mockReturnValue(
      value as ReturnType<typeof usePayments>,
    );
  }

  it("renders the error message when the query fails", () => {
    mockPayments({ data: undefined, isLoading: false, isError: true });

    renderWithIntl(<PaymentsListPage />);

    expect(screen.getByText("Couldn't load payments")).toBeInTheDocument();
  });

  it("renders the empty state when there are no payments", () => {
    mockPayments({ data: { data: [] }, isLoading: false, isError: false });

    renderWithIntl(<PaymentsListPage />);

    expect(screen.getByText("No payments yet")).toBeInTheDocument();
  });

  it("lists payments with their amount, purpose and status", () => {
    mockPayments({
      data: { data: [makePayment()] },
      isLoading: false,
      isError: false,
    });

    renderWithIntl(<PaymentsListPage />);

    expect(screen.getByText("12,000 EGP")).toBeInTheDocument();
    expect(screen.getByText(/Plan/)).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});

describe("PaymentDetailPage", () => {
  function setup(payment: SubscriptionPayment | undefined, opts: {
    isLoading?: boolean;
    isError?: boolean;
    cancel?: { mutate: ReturnType<typeof vi.fn>; isPending?: boolean };
    removeProof?: { mutate: ReturnType<typeof vi.fn>; isPending?: boolean };
  } = {}) {
    vi.mocked(usePayment).mockReturnValue({
      data: payment ? { data: payment } : undefined,
      isLoading: opts.isLoading ?? false,
      isError: opts.isError ?? false,
    } as ReturnType<typeof usePayment>);
    vi.mocked(useCancelPayment).mockReturnValue({
      mutate: opts.cancel?.mutate ?? vi.fn(),
      isPending: opts.cancel?.isPending ?? false,
    } as unknown as ReturnType<typeof useCancelPayment>);
    vi.mocked(useRemoveProof).mockReturnValue({
      mutate: opts.removeProof?.mutate ?? vi.fn(),
      isPending: opts.removeProof?.isPending ?? false,
    } as unknown as ReturnType<typeof useRemoveProof>);
  }

  it("renders the error fallback when the payment cannot be loaded", () => {
    setup(undefined, { isError: true });

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    expect(screen.getByText("Couldn't load this payment")).toBeInTheDocument();
  });

  it("renders the payment header with amount, provider and purpose", () => {
    setup(makePayment());

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    expect(screen.getByText("12,000 EGP")).toBeInTheDocument();
    expect(screen.getByText(/InstaPay/)).toBeInTheDocument();
  });

  it("shows the rejection reason for a rejected payment", () => {
    setup(
      makePayment({
        status: "REJECTED",
        rejection_reason: "Receipt unreadable",
      }),
    );

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    expect(screen.getByText("Receipt unreadable")).toBeInTheDocument();
  });

  it("confirms and cancels an open payment", () => {
    const mutate = vi.fn((_id, opts) => opts?.onSuccess?.());
    setup(makePayment({ status: "PENDING" }), { cancel: { mutate } });

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    // First click reveals the confirmation, second confirms.
    fireEvent.click(screen.getByRole("button", { name: "Cancel payment" }));
    expect(screen.getByText("Cancel this payment?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cancel payment" }));

    expect(mutate).toHaveBeenCalledWith("pay-1", expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith("Payment cancelled");
  });

  it("surfaces an ApiError message when cancelling fails", () => {
    const mutate = vi.fn((_id, opts) =>
      opts?.onError?.(new MockApiError(409, "Already verified")),
    );
    setup(makePayment({ status: "PENDING" }), { cancel: { mutate } });

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel payment" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel payment" }));

    expect(toast.error).toHaveBeenCalledWith("Already verified");
  });

  it("does not offer cancellation for a verified payment", () => {
    setup(makePayment({ status: "VERIFIED" }));

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    expect(
      screen.queryByRole("button", { name: "Cancel payment" }),
    ).not.toBeInTheDocument();
  });

  it("removes a proof when its delete button is clicked", () => {
    const mutate = vi.fn((_id, opts) => opts?.onSuccess?.());
    setup(
      makePayment({
        status: "PENDING",
        proofs: [
          {
            id: "proof-1",
            url: "https://x/p.pdf",
            content_type: "application/pdf",
            created_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      } as Partial<SubscriptionPayment>),
      { removeProof: { mutate } },
    );

    renderWithIntl(<PaymentDetailPage paymentId="pay-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(mutate).toHaveBeenCalledWith("proof-1", expect.any(Object));
    expect(toast.success).toHaveBeenCalledWith("Proof removed");
  });
});
