import { render, screen } from "@testing-library/react";

import WorkspaceMockup from "./WorkspaceMockup";

describe("WorkspaceMockup", () => {
  it("renders the static visit-workspace overview twin with fictional data", () => {
    render(<WorkspaceMockup />);

    // Breadcrumb + headings.
    expect(screen.getByText("Sara Ahmed", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("OB/GYN History Summary")).toBeInTheDocument();
    expect(screen.getByText("Current Journey")).toBeInTheDocument();
    expect(screen.getByText("Visits History")).toBeInTheDocument();

    // Section content.
    expect(screen.getByText("Surgical Journey")).toBeInTheDocument();
    expect(screen.getByText("General GYN Journey")).toBeInTheDocument();
    expect(screen.getByText("Pre-operative")).toBeInTheDocument();

    // Patient info rows.
    expect(screen.getByText("28 years")).toBeInTheDocument();
    expect(screen.getByText("Complete blood count (CBC)")).toBeInTheDocument();
  });

  it("renders the three surgical episodes", () => {
    render(<WorkspaceMockup />);
    expect(screen.getByText("Episode 1")).toBeInTheDocument();
    expect(screen.getByText("Episode 2")).toBeInTheDocument();
    expect(screen.getByText("Episode 3")).toBeInTheDocument();
  });
});
