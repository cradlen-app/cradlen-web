import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { SubscriptionBanner } from "./SubscriptionBanner";
import { useCurrentSubscription } from "../hooks/useSubscription";
import { isOwner } from "@/features/auth/lib/permissions";
import type { CurrentSubscription } from "../lib/subscriptions.types";

vi.mock("../hooks/useSubscription", () => ({
  useCurrentSubscription: vi.fn(),
}));
vi.mock("@/features/auth/hooks/useCurrentUser", () => ({
  useCurrentUser: () => ({ data: { profiles: [] } }),
}));
vi.mock("@/features/auth/lib/current-user", () => ({
  getActiveProfile: () => ({ organization: { id: "org-1" } }),
}));
vi.mock("@/features/auth/lib/permissions", () => ({
  isOwner: vi.fn(),
}));
vi.mock("@/hooks/useDashboardPath", () => ({
  useDashboardPath: () => (p = "") => p,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, ...props }: { children: React.ReactNode }) => (
    <a {...props}>{children}</a>
  ),
}));

const mockSub = vi.mocked(useCurrentSubscription);
const mockIsOwner = vi.mocked(isOwner);

function sub(status: CurrentSubscription["status"]): { data: { data: CurrentSubscription } } {
  return {
    data: {
      data: {
        id: "s1",
        status,
        starts_at: "2026-01-01T00:00:00Z",
        ends_at: null,
        trial_ends_at: null,
        plan: {
          id: "p1",
          plan: "center",
          max_organizations: 1,
          max_branches: 1,
          max_staff: 10,
        },
        effective_limits: { max_branches: 1, max_staff: 10 },
        add_ons: [],
      },
    },
  };
}

describe("SubscriptionBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsOwner.mockReturnValue(true);
  });

  it("renders nothing when the subscription is ACTIVE", () => {
    mockSub.mockReturnValue(sub("ACTIVE") as ReturnType<typeof useCurrentSubscription>);
    const { container } = renderWithIntl(<SubscriptionBanner />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the expired banner with a renew CTA for an owner", () => {
    mockSub.mockReturnValue(sub("EXPIRED") as ReturnType<typeof useCurrentSubscription>);
    renderWithIntl(<SubscriptionBanner />);
    expect(screen.getByText(/expired/i)).toBeInTheDocument();
    expect(screen.getByText(/renew now/i)).toBeInTheDocument();
  });

  it("shows a passive note for a non-owner when expired", () => {
    mockIsOwner.mockReturnValue(false);
    mockSub.mockReturnValue(sub("EXPIRED") as ReturnType<typeof useCurrentSubscription>);
    renderWithIntl(<SubscriptionBanner />);
    expect(screen.getByText(/contact your administrator/i)).toBeInTheDocument();
    expect(screen.queryByText(/renew now/i)).not.toBeInTheDocument();
  });
});
