import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { renderWithIntl } from "@/test/render";
import { ComingSoonPlaceholder } from "./ComingSoonPlaceholder";

describe("ComingSoonPlaceholder", () => {
  it("renders the history variant copy", () => {
    renderWithIntl(<ComingSoonPlaceholder section="history" />);
    expect(screen.getByText("History form coming soon")).toBeInTheDocument();
    expect(
      screen.getByText(/patient history form will load here/i),
    ).toBeInTheDocument();
  });

  it("renders the examination variant copy", () => {
    renderWithIntl(<ComingSoonPlaceholder section="examination" />);
    expect(
      screen.getByText("Examination form coming soon"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/encounter examination form will load here/i),
    ).toBeInTheDocument();
  });
});
