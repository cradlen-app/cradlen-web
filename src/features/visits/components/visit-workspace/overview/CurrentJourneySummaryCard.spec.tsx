import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CurrentJourneySummaryCard } from "./CurrentJourneySummaryCard";
import type { ActiveJourneySummary } from "@/features/journeys/lib/active-journey-summary.api";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  // The pregnancy identifier path renders <PregnancyTimeline>, which reads the
  // active locale for date formatting — stub it so the mock is complete.
  useLocale: () => "en",
}));

const mockQuery = vi.fn();
vi.mock("@/features/journeys/lib/useActiveJourneySummary", () => ({
  useActiveJourneySummary: () => mockQuery(),
}));

function summary(over: Partial<ActiveJourneySummary>): ActiveJourneySummary {
  return {
    journey_exists: true,
    journey_id: "j1",
    care_path_code: "OBGYN_PREGNANCY",
    care_path_label: "Pregnancy",
    status: "ACTIVE",
    is_active: true,
    started_at: "2026-01-01",
    ended_at: null,
    current_episode: { name: "Second Trimester", order: 2, status: "ACTIVE" },
    encounter: null,
    identifier: null,
    outcome: null,
    flags: [],
    narrative: "",
    ...over,
  };
}

describe("CurrentJourneySummaryCard", () => {
  it("renders nothing when the patient has no journey", () => {
    mockQuery.mockReturnValue({
      data: summary({ journey_exists: false }),
      isLoading: false,
      isError: false,
    });
    const { container } = render(<CurrentJourneySummaryCard patientId="p1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the pregnancy identifier + risk flag", () => {
    mockQuery.mockReturnValue({
      data: summary({
        identifier: {
          ga: "24w 3d",
          ga_source: "US",
          edd: "2026-10-08",
          lmp: "2026-01-01",
          risk_level: "HIGH",
          pregnancy_type: "SINGLETON",
          number_of_fetuses: 1,
          blood_group_rh: "O+",
        },
        flags: [{ label: "High risk", severity: "high" }],
      }),
      isLoading: false,
      isError: false,
    });
    render(<CurrentJourneySummaryCard patientId="p1" />);
    expect(screen.getByText("24w 3d (US)")).toBeInTheDocument();
    expect(screen.getByText("2026-10-08")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
  });

  it("falls back to the encounter block for a General GYN journey", () => {
    mockQuery.mockReturnValue({
      data: summary({
        care_path_code: "OBGYN_GENERAL",
        care_path_label: "General GYN",
        current_episode: { name: "General Consultation", order: 1, status: "ACTIVE" },
        encounter: {
          chief_complaint: "Pelvic pain",
          provisional_diagnosis: "Ovarian cyst",
        },
      }),
      isLoading: false,
      isError: false,
    });
    render(<CurrentJourneySummaryCard patientId="p1" />);
    expect(screen.getByText("Pelvic pain")).toBeInTheDocument();
    expect(screen.getByText("Ovarian cyst")).toBeInTheDocument();
  });
});
