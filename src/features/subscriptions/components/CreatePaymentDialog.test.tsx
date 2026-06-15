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
});
