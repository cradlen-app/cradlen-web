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
    {
      role_code: "EXTERNAL",
      role_name: "External",
      current: 5,
      previous: 4,
    },
  ],
};

describe("StaffStatCards", () => {
  beforeEach(() => {
    useStaffStatsMock.mockReset();
  });

  it("renders total, clinical, administrative, and external — not per-role cards", () => {
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

    // External comes from the EXTERNAL role entry in by_role.
    expect(screen.getByText("External")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();

    // The per-role breakdown is gone — non-external roles are not rendered.
    expect(screen.queryByText("Branch Manager")).not.toBeInTheDocument();
  });

  it("falls back to zero for external when no EXTERNAL role is present", () => {
    mockStats({
      total: { current: 4, previous: 4 },
      clinical: { current: 4, previous: 4 },
      by_role: [
        {
          role_code: "BRANCH_MANAGER",
          role_name: "Branch Manager",
          current: 1,
          previous: 1,
        },
      ],
    });
    renderWithIntl(
      <StaffStatCards organizationId="o1" branchId="b1" />,
    );

    expect(screen.getByText("External")).toBeInTheDocument();
    // total − clinical = 0 (administrative) and external = 0 → two zero cards.
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("renders the skeleton while loading", () => {
    mockStats(undefined, true);
    const { container } = renderWithIntl(
      <StaffStatCards organizationId="o1" branchId="b1" />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
