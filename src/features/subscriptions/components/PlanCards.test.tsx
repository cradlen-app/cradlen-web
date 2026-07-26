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
  Link: ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));
// PlanCards renders PlanLimitDrawer, which reaches into next/navigation params
// and the query stack. It only mounts on an over-limit error, so stub it
// out — these tests cover PlanCards' own plan-picking behavior.
vi.mock("./PlanLimitDrawer", () => ({ PlanLimitDrawer: () => null }));

const mockUsePlans = vi.mocked(usePlans);

const plans: Plan[] = [
  {
    id: "p-clinic",
    plan: "clinic",
    max_organizations: 1,
    max_branches: 1,
    included_journey_units: 300,
    is_contact_sales: false,
    prices: [{ billing_interval: "YEARLY", price: "15000", currency: "EGP" }],
  },
  {
    id: "p-center",
    plan: "center",
    max_organizations: 1,
    max_branches: 1,
    included_journey_units: 1000,
    is_contact_sales: false,
    prices: [{ billing_interval: "YEARLY", price: "35000", currency: "EGP" }],
  },
  {
    id: "p-hospital",
    plan: "hospital",
    max_organizations: 1,
    max_branches: 1,
    included_journey_units: 0,
    is_contact_sales: true,
    prices: [],
  },
  {
    id: "p-free",
    plan: "free_trial",
    max_organizations: 1,
    max_branches: 1,
    included_journey_units: 25,
    is_contact_sales: false,
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
    expect(screen.getByText("Clinic")).toBeInTheDocument();
    expect(screen.getByText("Center")).toBeInTheDocument();
    expect(screen.getByText("Hospital")).toBeInTheDocument();
    expect(screen.queryByText(/free trial/i)).not.toBeInTheDocument();
    // current plan (center) shows "Current" + a Renew button; clinic shows Upgrade
    expect(screen.getByText(/current/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /renew/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upgrade/i })).toBeInTheDocument();
    // journey-unit bullets, not staff
    expect(screen.getByText(/300 journey units/i)).toBeInTheDocument();
    expect(screen.getByText(/1,?000 journey units/i)).toBeInTheDocument();
  });

  it("shows a Contact sales CTA to /contact for the contact-sales plan", () => {
    renderWithIntl(
      <PlanCards organizationId="org-1" currentPlanCode="center" />,
    );
    const contact = screen.getByRole("link", { name: /contact sales/i });
    expect(contact).toHaveAttribute("href", "/contact");
    // contact-sales plan doesn't expose an upgrade button of its own
    expect(screen.getByText(/let's talk/i)).toBeInTheDocument();
  });

  it("opens the create-payment dialog when a plan is selected", () => {
    renderWithIntl(
      <PlanCards organizationId="org-1" currentPlanCode="center" />,
    );
    fireEvent.click(screen.getByRole("button", { name: /upgrade/i }));
    // dialog title interpolates the friendly plan name
    expect(screen.getByText(/subscribe to clinic/i)).toBeInTheDocument();
  });
});
