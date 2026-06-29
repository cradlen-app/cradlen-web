import { render, screen } from "@testing-library/react";

import SectionLabel from "./SectionLabel";

describe("SectionLabel", () => {
  it("renders the number and children", () => {
    render(<SectionLabel no="02">Why journeys</SectionLabel>);
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Why journeys")).toBeInTheDocument();
  });

  it("omits the number node when `no` is not provided", () => {
    const { container } = render(<SectionLabel>Features</SectionLabel>);
    expect(screen.getByText("Features")).toBeInTheDocument();
    // Only the divider span + label span (no leading number span).
    const spans = container.querySelectorAll("span");
    expect(spans).toHaveLength(2);
  });

  it("merges a custom className onto the root", () => {
    const { container } = render(
      <SectionLabel className="custom-class">Label</SectionLabel>,
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
