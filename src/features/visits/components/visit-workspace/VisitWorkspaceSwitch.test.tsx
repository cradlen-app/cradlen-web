import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/features/medical-rep/components/visit/MedicalRepVisitPage", () => ({
  MedicalRepVisitPage: ({ visitId }: { visitId: string }) => (
    <div data-testid="rep-page">{visitId}</div>
  ),
}));
vi.mock("./VisitWorkspacePage", () => ({
  VisitWorkspacePage: ({ visitId }: { visitId: string }) => (
    <div data-testid="patient-page">{visitId}</div>
  ),
}));

import { VisitWorkspaceSwitch } from "./VisitWorkspaceSwitch";

describe("VisitWorkspaceSwitch", () => {
  it("renders the medical-rep workspace when kind is medical_rep", () => {
    render(<VisitWorkspaceSwitch visitId="v-1" kind="medical_rep" />);
    expect(screen.getByTestId("rep-page")).toHaveTextContent("v-1");
    expect(screen.queryByTestId("patient-page")).toBeNull();
  });

  it("renders the patient workspace when kind is absent", () => {
    render(<VisitWorkspaceSwitch visitId="v-2" />);
    expect(screen.getByTestId("patient-page")).toHaveTextContent("v-2");
    expect(screen.queryByTestId("rep-page")).toBeNull();
  });

  it("renders the patient workspace for any other kind value", () => {
    render(<VisitWorkspaceSwitch visitId="v-3" kind="patient" />);
    expect(screen.getByTestId("patient-page")).toHaveTextContent("v-3");
  });
});
