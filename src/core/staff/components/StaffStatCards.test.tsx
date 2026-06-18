import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { ApiStaffStats } from "../types/staff.api.types";

const { useStaffStatsMock } = vi.hoisted(() => ({
  useStaffStatsMock: vi.fn(),
}));

vi.mock("../hooks/useStaffStats", () => ({
  useStaffStats: (...args: unknown[]) => useStaffStatsMock(...args),
}));

import { StaffStatCards } from "./StaffStatCards";

function mockStats(data: ApiStaffStats | undefined, isLoading = false) {
  useStaffStatsMock.mockReturnValue({ data, isLoading });
}

const STATS: ApiStaffStats = {
  total: { current: 20, previous: 16 }, // +25%
  clinical: { current: 12, previous: 10 }, // +20%
  // administrative (total − clinical) = { current: 8, previous: 6 } → +33%
  by_role: [
    {
      role_code: "BRANCH_MANAGER",
      role_name: "Branch Manager",
      current: 3,
      previous: 2,
    },
  ],
};

describe("StaffStatCards", () => {
  beforeEach(() => {
    useStaffStatsMock.mockReset();
  });

  it("renders total, clinical, administrative — not per-role cards", () => {
    mockStats(STATS);
    renderWithIntl(
      <StaffStatCards organizationId="o1" branchId="b1" />,
    );

    expect(screen.getByText("Total Staff")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();

    expect(screen.getByText("Clinical")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    // Administrative is derived as total − clinical (20 − 12 = 8).
    expect(screen.getByText("Administrative")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    // No External card and no per-role breakdown.
    expect(screen.queryByText("External")).not.toBeInTheDocument();
    expect(screen.queryByText("Branch Manager")).not.toBeInTheDocument();
  });

  it("shows a '+N new' badge instead of a dash when there's no prior baseline", () => {
    // A clinic created this month: previous is 0 everywhere, so a percentage
    // can't be computed — the cards should read "new" rather than "—".
    mockStats({
      total: { current: 1, previous: 0 },
      clinical: { current: 1, previous: 0 },
      by_role: [],
    });
    renderWithIntl(<StaffStatCards organizationId="o1" branchId="b1" />);

    // Total = +1 new, clinical = +1 new, administrative (1 − 1 = 0) stays a dash.
    expect(screen.getAllByText("+1 new")).toHaveLength(2);
  });

  it("renders the skeleton while loading", () => {
    mockStats(undefined, true);
    const { container } = renderWithIntl(
      <StaffStatCards organizationId="o1" branchId="b1" />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
