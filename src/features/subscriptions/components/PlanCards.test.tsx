import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { PlanCards } from "./PlanCards";
import { usePlans } from "../hooks/useSubscription";
import type { Plan } from "../lib/subscriptions.types";

vi.mock("../hooks/useSubscription", () => ({
  usePlans: vi.fn(),
  useCreatePayment: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p = "") => p,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockUsePlans = vi.mocked(usePlans);

const plans: Plan[] = [
  {
    id: "p-center",
    plan: "center",
    max_organizations: 1,
    max_branches: 1,
    max_staff: 10,
    prices: [{ billing_interval: "YEARLY", price: "22000", currency: "EGP" }],
  },
  {
    id: "p-network",
    plan: "network",
    max_organizations: 1,
    max_branches: 3,
    max_staff: 25,
    prices: [{ billing_interval: "YEARLY", price: "50000", currency: "EGP" }],
  },
  {
    id: "p-free",
    plan: "free_trial",
    max_organizations: 1,
    max_branches: 1,
    max_staff: 5,
    prices: [],
  },
];

describe("PlanCards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePlans.mockReturnValue({
      data: { data: plans },
      isLoading: false,
    } as ReturnType<typeof usePlans>);
  });

  it("hides free_trial and marks the current plan", () => {
    renderWithIntl(
      <PlanCards organizationId="org-1" currentPlanCode="center" />,
    );
    expect(screen.getByText("Center")).toBeInTheDocument();
    expect(screen.getByText("Network of Centers")).toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
    // current plan shows "Current" + a Renew button; the other shows Upgrade
    expect(screen.getByText(/current/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /renew/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade/i })).toBeInTheDocument();
  });

  it("opens the create-payment dialog when a plan is selected", () => {
    renderWithIntl(
      <PlanCards organizationId="org-1" currentPlanCode="center" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /upgrade/i }));
    // dialog title interpolates the friendly plan name
    expect(
      screen.getByText(/subscribe to network of centers/i),
    ).toBeInTheDocument();
  });
});
