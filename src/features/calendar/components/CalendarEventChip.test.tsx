import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalendarEventChip } from "./CalendarEventChip";

describe("CalendarEventChip", () => {
  it("renders the title and applies the type colour class", () => {
    const { container } = render(
      <CalendarEventChip title="Team sync" type="MEETING" />,
    );

    expect(screen.getByText("Team sync")).toBeInTheDocument();
    // MEETING maps to the brand-primary chip background.
    expect(container.querySelector("span")).toHaveClass("bg-brand-primary");
  });

  it("shows the creator name and folds it into the title attribute", () => {
    const { container } = render(
      <CalendarEventChip title="Procedure" type="PROCEDURE" creatorName="Dr. Smith" />,
    );

    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    expect(container.querySelector("span")).toHaveAttribute(
      "title",
      "Procedure · Dr. Smith",
    );
  });

  it("prefixes the title with a continuation arrow when isContinuation", () => {
    render(
      <CalendarEventChip title="Conference" type="DAY_OFF" isContinuation />,
    );

    expect(screen.getByText("↳ Conference")).toBeInTheDocument();
  });
});
