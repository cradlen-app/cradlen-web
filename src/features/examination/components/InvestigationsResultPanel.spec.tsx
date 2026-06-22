import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  InvestigationsResultPanel,
  type ExaminationInvestigation,
} from "./InvestigationsResultPanel";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const base: ExaminationInvestigation = {
  id: "i1",
  custom_test_name: "CBC",
  test_category: "LAB",
  status: "REVIEWED",
  result_text: "Normal range",
  notes: "Fasting",
  result_attachments: [{ id: "a1" }],
};

describe("InvestigationsResultPanel", () => {
  it("renders name, result, and notes for an investigation", () => {
    render(<InvestigationsResultPanel investigations={[base]} />);
    expect(screen.getByText("CBC")).toBeInTheDocument();
    expect(screen.getByText("Normal range")).toBeInTheDocument();
    expect(screen.getByText("Fasting")).toBeInTheDocument();
    expect(screen.getByText("invStatus.REVIEWED")).toBeInTheDocument();
  });

  it("shows the no-result placeholder when result_text is empty", () => {
    render(
      <InvestigationsResultPanel
        investigations={[{ ...base, result_text: null }]}
      />,
    );
    expect(screen.getByText("invNoResult")).toBeInTheDocument();
  });

  it("renders the empty state when there are no investigations", () => {
    render(<InvestigationsResultPanel investigations={[]} />);
    expect(screen.getByText("invNone")).toBeInTheDocument();
  });
});
