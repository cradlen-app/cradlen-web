import { render, screen } from "@testing-library/react";

vi.mock("next-intl/server", () => ({
  getTranslations: async () => ((key: string) => key) as unknown,
}));

import WhatsInside from "./WhatsInside";

describe("WhatsInside", () => {
  it("renders the feature card headings", async () => {
    render(await WhatsInside());

    expect(screen.getByText("eyebrow")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "heading" }),
    ).toBeInTheDocument();

    for (const title of [
      "journeys.title",
      "calendar.title",
      "prescriptions.title",
      "medicalHistory.title",
      "cash.title",
      "exams.title",
    ]) {
      expect(
        screen.getByRole("heading", { name: title }),
      ).toBeInTheDocument();
    }
  });

  it("renders the journey stepper labels and the medical-history records", async () => {
    render(await WhatsInside());

    // Five journey stepper labels.
    for (const step of [
      "journeys.step1",
      "journeys.step2",
      "journeys.step3",
      "journeys.step4",
      "journeys.step5",
    ]) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }

    // Three unified-record rows.
    expect(screen.getByText("medicalHistory.row1Label")).toBeInTheDocument();
    expect(screen.getByText("medicalHistory.row2Label")).toBeInTheDocument();
    expect(screen.getByText("medicalHistory.row3Label")).toBeInTheDocument();
  });
});
