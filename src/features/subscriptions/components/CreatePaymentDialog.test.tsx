import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { CreatePaymentDialog } from "./CreatePaymentDialog";
import { useCreatePayment } from "../hooks/useSubscription";
import type { AvailableAddOn } from "../lib/subscriptions.types";

const mutate = vi.fn();

vi.mock("../hooks/useSubscription", () => ({
  useCreatePayment: vi.fn(() => ({ mutate, isPending: false })),
}));
vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p = "") => p,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const userAddOn: AvailableAddOn = {
  id: "a-user",
  code: "center_extra_user",
  name: "Center — extra user",
  kind: "EXTRA_USER",
  delta_branches: 0,
  delta_users: 1,
  price: "2000",
  currency: "EGP",
};

describe("CreatePaymentDialog (add-on mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreatePayment).mockReturnValue({
      mutate,
      isPending: false,
    } as unknown as ReturnType<typeof useCreatePayment>);
  });

  it("submits the add-on code with the stepped quantity", () => {
    renderWithIntl(
      <CreatePaymentDialog
        mode="addon"
        organizationId="org-1"
        addOn={userAddOn}
        currentPlanCode="center"
        open
        onOpenChange={() => {}}
      />,
    );

    // Bump quantity to 2, then submit.
    fireEvent.click(screen.getByLabelText("increase"));
    fireEvent.click(screen.getByRole("button", { name: /continue to payment/i }));

    expect(mutate).toHaveBeenCalledWith(
      {
        plan: "center",
        provider: "INSTAPAY",
        add_on_code: "center_extra_user",
        quantity: 2,
      },
      expect.any(Object),
    );
  });

  it("caps the displayed total at the yearly price on a multi-year term", () => {
    const threeYearsOut = new Date(
      Date.now() + 3 * 365 * 86_400_000,
    ).toISOString();
    renderWithIntl(
      <CreatePaymentDialog
        mode="addon"
        organizationId="org-1"
        addOn={userAddOn}
        currentPlanCode="center"
        subscriptionEndsAt={threeYearsOut}
        open
        onOpenChange={() => {}}
      />,
    );

    // 2,000/year with ~3 years remaining still shows one year's price.
    expect(screen.getByText(/2,000(\.00)?\s*EGP/)).toBeInTheDocument();

    // Quantity multiplies the capped total.
    fireEvent.click(screen.getByLabelText("increase"));
    expect(screen.getByText(/4,000(\.00)?\s*EGP/)).toBeInTheDocument();
  });

  it("prorates the displayed total for a part-year term", () => {
    // ~half a year remaining (183 days): 2000 × 183/365 ≈ 1,002.74
    const halfYearOut = new Date(
      Date.now() + 183 * 86_400_000,
    ).toISOString();
    renderWithIntl(
      <CreatePaymentDialog
        mode="addon"
        organizationId="org-1"
        addOn={userAddOn}
        currentPlanCode="center"
        subscriptionEndsAt={halfYearOut}
        open
        onOpenChange={() => {}}
      />,
    );

    expect(screen.getByText(/1,002\.74\s*EGP/)).toBeInTheDocument();
  });
});
