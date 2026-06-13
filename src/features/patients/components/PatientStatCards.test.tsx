import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/render";
import type { ApiPatientStats } from "@/features/visits/types/visits.api.types";

const { usePatientStatsMock } = vi.hoisted(() => ({
  usePatientStatsMock: vi.fn(),
}));

vi.mock("../hooks/usePatientStats", () => ({
  usePatientStats: (...args: unknown[]) => usePatientStatsMock(...args),
}));

import { PatientStatCards } from "./PatientStatCards";

function mockStats(data: ApiPatientStats | undefined, isLoading = false) {
  usePatientStatsMock.mockReturnValue({ data, isLoading });
}

const STATS: ApiPatientStats = {
  total: { current: 120, previous: 100 }, // +20%
  new_this_month: { current: 30, previous: 20 }, // +50%
  // Sorted desc by `current` as the API returns it; only the top two render.
  by_care_path: [
    {
      journey_template_id: "t-preg",
      name: "Pregnancy",
      specialty_id: "s-obgyn",
      specialty_name: "OB/GYN",
      type: "PREGNANCY",
      current: 50,
      previous: 40, // +25%
    },
    {
      journey_template_id: "t-acne",
      name: "Acne Plan",
      specialty_id: "s-derm",
      specialty_name: "Dermatology",
      type: "CHRONIC_CONDITION",
      current: 8,
      previous: 10, // -20%
    },
    {
      journey_template_id: "t-surg",
      name: "Surgical Plan",
      specialty_id: "s-surg",
      specialty_name: "Surgery",
      type: "SURGICAL",
      current: 3,
      previous: 2,
    },
  ],
};

describe("PatientStatCards", () => {
  beforeEach(() => {
    usePatientStatsMock.mockReset();
  });

  it("renders total + new-this-month + the top two care paths, labelled from the data", () => {
    mockStats(STATS);
    renderWithIntl(<PatientStatCards branchId="b1" orgWide={false} />);

    // Total card.
    expect(screen.getByText("Total Patients")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();

    // New this month card.
    expect(screen.getByText("New This Month")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();

    // Care-path cards come straight from the API names — not a hardcoded enum.
    expect(screen.getByText("Pregnancy")).toBeInTheDocument();
    expect(screen.getByText("Acne Plan")).toBeInTheDocument();
    expect(screen.getByText("50")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();

    // Only the top two care paths render — the third is dropped to keep four cards.
    expect(screen.queryByText("Surgical Plan")).not.toBeInTheDocument();
  });

  it("shows the correct trend direction per card", () => {
    mockStats(STATS);
    renderWithIntl(<PatientStatCards branchId="b1" orgWide={false} />);

    expect(screen.getByText("+20%")).toBeInTheDocument(); // total, up
    expect(screen.getByText("+50%")).toBeInTheDocument(); // new this month, up
    expect(screen.getByText("+25%")).toBeInTheDocument(); // pregnancy, up
    expect(screen.getByText("-20%")).toBeInTheDocument(); // acne, down
  });

  it("renders the no-prior marker when there is no previous value", () => {
    mockStats({
      total: { current: 5, previous: 0 },
      new_this_month: { current: 5, previous: 3 },
      by_care_path: [],
    });
    renderWithIntl(<PatientStatCards branchId="b1" orgWide={false} />);

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders the skeleton while loading", () => {
    mockStats(undefined, true);
    const { container } = renderWithIntl(
      <PatientStatCards branchId="b1" orgWide={false} />,
    );
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});
