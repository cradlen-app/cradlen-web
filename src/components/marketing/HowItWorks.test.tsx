import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

const STEPS = [
  { title: "Create your clinic", description: "Spin up an organization" },
  { title: "Invite your team", description: "Add doctors and reception" },
  { title: "Map care paths", description: "Define journeys" },
  { title: "Track outcomes", description: "Watch the dashboard" },
];

vi.mock("next-intl/server", () => ({
  getTranslations: async () => {
    const t = ((key: string) => key) as unknown as {
      (key: string): string;
      raw: (key: string) => unknown;
    };
    t.raw = (key: string) => (key === "steps" ? STEPS : key);
    return t;
  },
}));

vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={typeof href === "string" ? href : "#"}>{children}</a>
  ),
}));

import HowItWorks from "./HowItWorks";

describe("HowItWorks", () => {
  it("renders the eyebrow, heading and one card per step", async () => {
    render(await HowItWorks());

    expect(screen.getByText("eyebrow")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "heading" }),
    ).toBeInTheDocument();

    for (const step of STEPS) {
      expect(
        screen.getByRole("heading", { level: 3, name: step.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
    }

    // Numbered badges 01..04.
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("04")).toBeInTheDocument();
  });

  it("renders the documentation band with a link to the guide", async () => {
    render(await HowItWorks());

    expect(screen.getByText("docs.heading")).toBeInTheDocument();
    const docsLink = screen.getByRole("link", { name: /docs\.readDocs/ });
    expect(docsLink).toHaveAttribute("href", "/guide");
  });
});
