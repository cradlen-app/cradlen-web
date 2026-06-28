import { render, screen } from "@testing-library/react";

import HelpCenterFaq from "./HelpCenterFaq";

const CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      { q: "How do I create a clinic?", a: "Register an organization." },
      { q: "Can I invite my team?", a: "Yes, from the staff page." },
    ],
  },
  {
    id: "billing",
    title: "Billing",
    items: [{ q: "How is billing handled?", a: "Charge at booking." }],
  },
];

describe("HelpCenterFaq", () => {
  it("renders a section per category with its anchor id", () => {
    const { container } = render(<HelpCenterFaq categories={CATEGORIES} />);

    expect(
      screen.getByRole("heading", { name: "Getting started" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();

    expect(container.querySelector("#getting-started")).not.toBeNull();
    expect(container.querySelector("#billing")).not.toBeNull();
  });

  it("renders every question as an accordion trigger", () => {
    render(<HelpCenterFaq categories={CATEGORIES} />);

    const triggers = screen.getAllByRole("button");
    // One trigger per FAQ item across all categories (2 + 1).
    expect(triggers).toHaveLength(3);

    expect(
      screen.getByRole("button", { name: "How do I create a clinic?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "How is billing handled?" }),
    ).toBeInTheDocument();
  });
});
