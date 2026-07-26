import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/render";
import { JourneyUsageMeter } from "./JourneyUsageMeter";
import { useSubscriptionUsage } from "../hooks/useSubscription";
import type { JourneyUsage } from "../lib/subscriptions.types";

vi.mock("../hooks/useSubscription", () => ({
  useSubscriptionUsage: vi.fn(),
}));

const mockUsage = vi.mocked(useSubscriptionUsage);

function usage(over: Partial<JourneyUsage>): {
  data: { data: JourneyUsage };
  isLoading: boolean;
  isError: boolean;
} {
  return {
    data: {
      data: {
        allowance: 300,
        consumed: 100,
        remaining: 200,
        percent: 33,
        blocked: false,
        breakdown: {},
        ...over,
      },
    },
    isLoading: false,
    isError: false,
  };
}

describe("JourneyUsageMeter", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows consumed/allowance, remaining and the care-path breakdown", () => {
    mockUsage.mockReturnValue(
      usage({
        consumed: 210,
        remaining: 90,
        percent: 70,
        breakdown: { OBGYN_PREGNANCY: 6, OBGYN_SURGICAL: 4, OBGYN_GENERAL: 0 },
      }) as ReturnType<typeof useSubscriptionUsage>,
    );
    renderWithIntl(<JourneyUsageMeter organizationId="org-1" />);

    expect(screen.getByText(/210 of 300 units/i)).toBeInTheDocument();
    expect(screen.getByText(/90 units remaining/i)).toBeInTheDocument();
    // weight-0 general gyn (0 units) is filtered out of the breakdown
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Surgical")).toBeInTheDocument();
    expect(screen.queryByText("General gynecology")).not.toBeInTheDocument();
  });

  it("renders a warning when the allowance is blocked", () => {
    mockUsage.mockReturnValue(
      usage({
        consumed: 300,
        remaining: 0,
        percent: 100,
        blocked: true,
      }) as ReturnType<typeof useSubscriptionUsage>,
    );
    renderWithIntl(<JourneyUsageMeter organizationId="org-1" />);
    expect(screen.getByText(/reached your journey limit/i)).toBeInTheDocument();
  });

  it("shows 'Unlimited' for a contact-sales allowance and no bar", () => {
    mockUsage.mockReturnValue(
      usage({
        allowance: null,
        remaining: null,
        percent: 0,
        consumed: 12,
      }) as ReturnType<typeof useSubscriptionUsage>,
    );
    renderWithIntl(<JourneyUsageMeter organizationId="org-1" />);
    expect(screen.getByText(/unlimited/i)).toBeInTheDocument();
    expect(screen.queryByText(/of .* units/i)).not.toBeInTheDocument();
  });

  it("renders nothing while the usage read is missing", () => {
    mockUsage.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useSubscriptionUsage>);
    const { container } = renderWithIntl(
      <JourneyUsageMeter organizationId="org-1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
