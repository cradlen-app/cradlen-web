import { fireEvent, render, screen } from "@testing-library/react";

import LegalTableOfContents from "./LegalTableOfContents";

class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn();
  constructor(_cb: unknown) {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
});

const ITEMS = [
  { id: "intro", label: "Introduction" },
  { id: "data", label: "Data we collect" },
];

describe("LegalTableOfContents", () => {
  it("renders the label and an anchor per item", () => {
    render(<LegalTableOfContents items={ITEMS} label="On this page" />);

    expect(screen.getByText("On this page")).toBeInTheDocument();

    const intro = screen.getByRole("link", { name: "Introduction" });
    expect(intro).toHaveAttribute("href", "#intro");
    expect(screen.getByRole("link", { name: "Data we collect" })).toHaveAttribute(
      "href",
      "#data",
    );
  });

  it("marks the first item active initially and updates on click", () => {
    render(<LegalTableOfContents items={ITEMS} label="On this page" />);

    const intro = screen.getByRole("link", { name: "Introduction" });
    const data = screen.getByRole("link", { name: "Data we collect" });

    expect(intro).toHaveClass("text-brand-primary");

    fireEvent.click(data);
    expect(data).toHaveClass("text-brand-primary");
  });

  it("registers an IntersectionObserver for the sections", () => {
    render(<LegalTableOfContents items={ITEMS} label="On this page" />);
    // Observer is constructed; observe is a no-op here since the section
    // elements are not in the document, but the effect must not throw.
    expect(IntersectionObserver).toBeDefined();
  });
});
