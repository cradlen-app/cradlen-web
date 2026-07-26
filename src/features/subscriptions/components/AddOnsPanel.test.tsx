import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { AddOnsPanel } from "./AddOnsPanel";
import { useAddOns } from "../hooks/useSubscription";
import type { AvailableAddOn } from "../lib/subscriptions.types";

vi.mock("../hooks/useSubscription", () => ({
  useAddOns: vi.fn(),
  useCreatePayment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p = "") => p,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUseAddOns = vi.mocked(useAddOns);

const addOns: AvailableAddOn[] = [
  {
    id: "a-branch",
    code: "center_extra_branch",
    name: "Center — extra branch",
    kind: "BRANCH_BUNDLE",
    delta_branches: 1,
    delta_users: 0,
    delta_journey_units: 0,
    price: "21000",
    currency: "EGP",
  },
  {
    id: "a-pack",
    code: "journey_pack_s",
    name: "Journey pack S",
    kind: "JOURNEY_PACK",
    delta_branches: 0,
    delta_users: 0,
    delta_journey_units: 100,
    price: "6000",
    currency: "EGP",
  },
];

describe("AddOnsPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAddOns.mockReturnValue({
      data: { data: addOns },
      isLoading: false,
    } as ReturnType<typeof useAddOns>);
  });

  it("lists available add-ons and opens the buy dialog", () => {
    renderWithIntl(
      <AddOnsPanel
        organizationId="org-1"
        currentPlanCode="center"
        subscriptionEndsAt={null}
        isActive
      />,
    );
    expect(screen.getByText("Extra branch")).toBeInTheDocument();
    expect(screen.getByText("Journey pack")).toBeInTheDocument();
    // grants dispatch on kind: branch bundle vs journey pack
    expect(screen.getByText(/\+1 branch/i)).toBeInTheDocument();
    expect(screen.getByText(/\+100 journey units/i)).toBeInTheDocument();

    const buyButtons = screen.getAllByRole("button", { name: /add/i });
    fireEvent.click(buyButtons[0]); // the branch bundle
    expect(screen.getByText(/add extra branch/i)).toBeInTheDocument();
  });

  it("shows the requires-active hint and no buy buttons when not active", () => {
    renderWithIntl(
      <AddOnsPanel
        organizationId="org-1"
        currentPlanCode="center"
        subscriptionEndsAt={null}
        isActive={false}
      />,
    );
    expect(
      screen.getByText(/activate a paid plan to purchase add-ons/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add/i }),
    ).not.toBeInTheDocument();
  });
});
