import { render, screen, waitFor } from "@testing-library/react";

import ArticleToc from "./ArticleToc";

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

afterEach(() => {
  document.body.innerHTML = "";
});

describe("ArticleToc", () => {
  it("renders nothing when there is no guide article with headings", () => {
    const { container } = render(<ArticleToc label="On this page" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("collects h2 headings from #guide-article and renders anchor links", async () => {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<article id="guide-article">
        <h2 id="overview">Overview</h2>
        <h2 id="setup">Setup steps</h2>
        <h2>No id ignored</h2>
      </article>`,
    );

    render(<ArticleToc label="On this page" />);

    // Headings are published on the next animation frame; the TOC renders one
    // anchor link per h2 that has an id (the id-less h2 is skipped).
    expect(
      await screen.findByRole("link", { name: "Overview" }),
    ).toHaveAttribute("href", "#overview");
    expect(screen.getByRole("link", { name: "Setup steps" })).toHaveAttribute(
      "href",
      "#setup",
    );
    expect(
      screen.queryByRole("link", { name: "No id ignored" }),
    ).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("On this page")).toBeInTheDocument();
    });
  });
});
