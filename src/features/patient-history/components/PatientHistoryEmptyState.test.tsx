import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { renderWithIntl } from "@/test/render";
import { PatientHistoryEmptyState } from "./PatientHistoryEmptyState";

describe("PatientHistoryEmptyState", () => {
  it("renders the no-specialty copy", () => {
    renderWithIntl(<PatientHistoryEmptyState reason="no_specialty" />);
    expect(
      screen.getByText("No specialty for this visit"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/A specialty must be selected at booking/),
    ).toBeInTheDocument();
  });

  it("renders the no-template copy with the specialty code interpolated", () => {
    renderWithIntl(
      <PatientHistoryEmptyState reason="no_template" specialtyCode="OBGYN" />,
    );
    expect(
      screen.getByText("No history form configured"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No patient-history form is published for the OBGYN/),
    ).toBeInTheDocument();
  });

  it("tolerates a missing specialty code", () => {
    renderWithIntl(<PatientHistoryEmptyState reason="no_template" />);
    expect(
      screen.getByText("No history form configured"),
    ).toBeInTheDocument();
  });
});
